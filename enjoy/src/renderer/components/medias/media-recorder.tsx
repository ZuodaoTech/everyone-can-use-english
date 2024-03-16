import { useEffect, useState, useContext, useRef } from "react";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import WaveSurfer from "wavesurfer.js";
import { t } from "i18next";
import { useTranscribe } from "@renderer/hooks";
import { toast } from "@renderer/components/ui";
import {
  FFMPEG_TRIM_SILENCE_OPTIONS,
  FFMPEG_CONVERT_WAV_OPTIONS,
} from "@/constants";

export const MediaRecorder = (props: { height?: number }) => {
  const { height = 192 } = props;
  const {
    media,
    isRecording,
    setIsRecording,
    transcription,
    currentSegmentIndex,
  } = useContext(MediaPlayerProviderContext);
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

  const createRecording = async (params: { blob: Blob; duration: number }) => {
    if (!media) return;

    const { blob, duration } = params;

    toast.promise(
      async () => {
        let output: Blob;
        output = await transcode(blob, [
          // ...FFMPEG_TRIM_SILENCE_OPTIONS,
          ...FFMPEG_CONVERT_WAV_OPTIONS,
        ]);

        const currentSegment =
          transcription?.result?.timeline?.[currentSegmentIndex];
        if (!currentSegment) return;

        return EnjoyApp.recordings.create({
          targetId: media.id,
          targetType: media.mediaType,
          blob: {
            type: output.type.split(";")[0],
            arrayBuffer: await output.arrayBuffer(),
          },
          referenceId: currentSegmentIndex,
          referenceText: currentSegment.text,
          duration,
        });
      },
      {
        loading: t("savingRecording"),
        success: t("recordingSaved"),
        error: (e) => t("failedToSaveRecording" + " : " + e.message),
        position: "bottom-right",
      },
    );
  };

  useEffect(() => {
    if (!access) return;
    if (!isRecording) return;
    if (!ref.current) return;

    const ws = WaveSurfer.create({
      container: ref.current,
      fillParent: true,
      height,
      autoCenter: false,
      normalize: false,
    });

    const record = ws.registerPlugin(RecordPlugin.create());
    let startAt = 0;

    record.on("record-start", () => {
      startAt = Date.now();
    });

    record.on("record-end", async (blob: Blob) => {
      createRecording({ blob, duration: Date.now() - startAt });
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
          }, 100);
        } else {
          toast.error(t("cannotFindMicrophone"));
        }
      });

    return () => {
      clearInterval(interval);
      record.stopRecording();
      ws.destroy();
    };
  }, [ref, isRecording, access]);

  useEffect(() => {
    askForMediaAccess();
  }, []);

  return (
    <div className="border rounded-xl shadow-lg relative">
      <span className="absolute bottom-2 right-2 serif">
        {duration / 10}
        <span className="text-xs"> / 300</span>
      </span>
      <div className="h-full" ref={ref}></div>
    </div>
  );
};
