import { createContext, useEffect, useState, useContext, useRef } from "react";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import WaveSurfer from "wavesurfer.js";
import { t } from "i18next";
import { useTranscribe } from "@renderer/hooks";
import { Button, toast } from "@renderer/components/ui";
import { StopCircleIcon } from "lucide-react";

export const AudioRecorder = () => {
  const { recordings, isRecording, setIsRecording, currentRecording } =
    useContext(MediaPlayerProviderContext);
  const [access, setAccess] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { transcode } = useTranscribe();

  const ref = useRef(null);

  const askForMediaAccess = () => {
    EnjoyApp.system.preferences.mediaAccess("microphone").then((access) => {
      if (access) {
        setAccess(true);
      } else {
        setAccess(false);
        toast.warning(t("noMicrophoneAccess"));
      }
    });
  };

  useEffect(() => {
    if (!isRecording) return;
    if (!ref.current) return;

    const ws = WaveSurfer.create({
      container: ref.current,
      fillParent: true,
      waveColor: "#fff",
      height: 150,
      autoCenter: false,
      normalize: false,
    });

    const record = ws.registerPlugin(RecordPlugin.create());
    let startAt = 0;

    record.on("record-start", () => {
      startAt = Date.now();
    });

    record.on("record-end", async (blob: Blob) => {
      const duration = Date.now() - startAt;
      try {
        const output = await transcode(blob);
      } catch (e) {
        console.error(e);
        toast.error(t("failedToSaveRecording"));
      }
    });
    let interval: NodeJS.Timeout;

    RecordPlugin.getAvailableAudioDevices()
      .then((devices) => devices.find((d) => d.kind === "audioinput"))
      .then((device) => {
        if (device) {
          record.startRecording({ deviceId: device.deviceId });
          setDuration(0);
          interval = setInterval(() => {
            setDuration((duration) => {
              if (duration >= 300) {
                setIsRecording(false);
              }
              return duration + 1;
            });
          }, 1000);
        } else {
          toast.error(t("cannotFindMicrophone"));
        }
      });

    return () => {
      clearInterval(interval);
      record.stopRecording();
      ws.destroy();
    };
  }, [ref, isRecording]);

  useEffect(() => {
    askForMediaAccess();
  }, []);

  return (
    <div className="w-full relative">
      <span className="absolute bottom-2 right-2 text-white serif">
        {duration}
        <span className="text-xs"> / 300</span>
      </span>
      <div className="h-full bg-red-500/50" ref={ref}></div>
    </div>
  );
};
