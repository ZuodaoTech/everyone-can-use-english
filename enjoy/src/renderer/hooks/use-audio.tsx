import { useEffect, useContext, useState } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";

export const useAudio = (options: { id?: string; md5?: string }) => {
  const { id, md5 } = options;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [audio, setAudio] = useState<AudioType>(null);

  const onAudioUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model !== "Audio") return;
    if (record?.id != audio?.id) return;
    if (action !== "update") return;

    setAudio(record);
  };

  useEffect(() => {
    const where = id ? { id } : { md5 };
    EnjoyApp.audios.findOne(where).then((audio) => {
      if (audio) {
        setAudio(audio);
      } else {
        toast.error(t("models.audio.notFound"));
      }
    });

    addDblistener(onAudioUpdate);
    return () => {
      removeDbListener(onAudioUpdate);
    };
  }, [id, md5]);

  return {
    audio,
  };
};
