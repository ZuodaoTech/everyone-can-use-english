import { useEffect, useContext, useState } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";

export const useVideo = (options: { id?: string; md5?: string }) => {
  const { id, md5 } = options;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [video, setVideo] = useState<VideoType>(null);

  const onAudioUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model !== "Audio") return;
    if (record?.id != video?.id) return;
    if (action !== "update") return;

    setVideo(record);
  };

  useEffect(() => {
    const where = id ? { id } : { md5 };
    EnjoyApp.videos.findOne(where).then((video) => {
      if (video) {
        setVideo(video);
      } else {
        toast.error(t("models.video.notFound"));
      }
    });

    addDblistener(onAudioUpdate);
    return () => {
      removeDbListener(onAudioUpdate);
    };
  }, [id, md5]);

  return {
    video,
  };
};
