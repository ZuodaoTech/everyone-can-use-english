import { createContext, useEffect, useState, useContext, useRef } from "react";
import {
  WavesurferContext,
  WavesurferProvider,
  AppSettingsProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import { toast } from "@renderer/components/ui";
import { LoaderSpin } from "@renderer/components";

export const AudioPlayer = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { setMedia, initialized, setRef } = useContext(WavesurferContext);
  const ref = useRef(null);

  useEffect(() => {
    const where = id ? { id } : { md5 };
    EnjoyApp.audios.findOne(where).then((audio) => {
      if (audio) {
        setMedia(audio);
      } else {
        toast.error(t("models.audio.notFound"));
      }
    });
  }, [id, md5]);

  useEffect(() => {
    setRef(ref);
  }, []);

  return (
    <div data-testid="audio-player">
      <div className="grid grid-cols-7 gap-4">
        <div className="col-span-5 h-[calc(100vh-6.5rem)] flex flex-col">
          <div ref={ref} />
        </div>
        <div className="col-span-2 h-[calc(100vh-6.5rem)]">
        </div>
      </div>
    </div>
  );
};
