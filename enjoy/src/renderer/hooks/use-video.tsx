import { useEffect, useContext, useState } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { useThrottle } from "@uidotdev/usehooks";

export const useVideo = (options: { id?: string; md5?: string }) => {
  const { id, md5 } = options;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [video, setVideo] = useState<VideoType>(null);
  const throttledVideo = useThrottle(video, 500);

  const onVideoUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model !== "Video") return;
    if (id && record.id !== id) return;
    if (md5 && record.md5 !== md5) return;
    if (action !== "update") return;

    setVideo(record);
  };

  useEffect(() => {
    const where = id ? { id } : md5 ? { md5 } : null;
    if (!where) return;

    EnjoyApp.videos.findOne(where).then((video) => {
      if (video) {
        setVideo(video);
      } else {
        toast.error(t("models.video.notFound"));
      }
    });

    addDblistener(onVideoUpdate);
    return () => {
      removeDbListener(onVideoUpdate);
    };
  }, [id, md5]);

  return {
    video: throttledVideo,
  };
};
