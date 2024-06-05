import { useEffect, useState, useContext, useRef } from "react";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import WaveSurfer from "wavesurfer.js";
import { t } from "i18next";
import { toast } from "@renderer/components/ui";
import { MediaRecordButton } from "@renderer/components";

const ONE_MINUTE = 60;

export const MediaRecorder = () => {
  const {
    layout,
    media,
    isRecording,
    setIsRecording,
    transcription,
    currentSegmentIndex,
    currentSegment,
    createSegment,
  } = useContext(MediaPlayerProviderContext);
  const [player, setPlayer] = useState<WaveSurfer>();
  const [access, setAccess] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

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
        const currentSegment =
          transcription?.result?.timeline?.[currentSegmentIndex];
        if (!currentSegment) return;

        await EnjoyApp.recordings.create({
          targetId: media.id,
          targetType: media.mediaType,
          blob: {
            type: blob.type.split(";")[0],
            arrayBuffer: await blob.arrayBuffer(),
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
      }
    );
  };

  useEffect(() => {
    if (!access) return;
    if (!isRecording) return;
    if (!ref.current) return;
    if (!layout?.playerHeight) return;

    const ws = WaveSurfer.create({
      container: ref.current,
      fillParent: true,
      height: layout.playerHeight,
      autoCenter: false,
      normalize: false,
    });
    setPlayer(ws);

    const record = ws.registerPlugin(RecordPlugin.create());
    let startAt = 0;

    record.on("record-start", () => {
      startAt = Date.now();
    });

    record.on("record-end", async (blob: Blob) => {
      createRecording({ blob, duration: Date.now() - startAt });
      setIsRecording(false);
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
              if (duration >= ONE_MINUTE) {
                record.stopRecording();
              }
              return duration + 0.1;
            });
          }, 100);
        } else {
          toast.error(t("cannotFindMicrophone"));
        }
      });

    return () => {
      if (interval) clearInterval(interval);
      record?.stopRecording();
      player?.destroy();
    };
  }, [ref, isRecording, access, layout?.playerHeight]);

  useEffect(() => {
    if (!currentSegment) {
      createSegment();
    }
    askForMediaAccess();
  }, []);

  return (
    <div className="h-full w-full flex items-center space-x-4">
      <div className="flex-1 h-full border rounded-xl shadow-lg relative">
        <span className="absolute bottom-2 right-2 serif">
          {duration.toFixed(1)}
          <span className="text-xs"> / {ONE_MINUTE}</span>
        </span>
        <div className="h-full" ref={ref}></div>
      </div>

      <div className="h-full flex flex-col justify-start space-y-1.5">
        <MediaRecordButton
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </div>
    </div>
  );
};
