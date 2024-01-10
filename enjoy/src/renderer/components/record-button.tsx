import { t } from "i18next";
import { MicIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import WaveSurfer from "wavesurfer.js";
import { cn } from "@renderer/lib/utils";
import { RadialProgress, useToast } from "@renderer/components/ui";
import { useHotkeys } from "react-hotkeys-hook";

export const RecordButton = (props: {
  className?: string;
  disabled: boolean;
  onRecordBegin?: () => void;
  onRecordEnd: (blob: Blob, duration: number) => void;
}) => {
  const { className, disabled, onRecordBegin, onRecordEnd } = props;
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const { toast } = useToast();

  useHotkeys(["command+alt+r", "control+alt+r"], () => {
    if (disabled) return;
    setIsRecording((isRecording) => !isRecording);
  });

  useEffect(() => {
    if (!isRecording) return;

    onRecordBegin?.();
    setDuration(0);
    const interval = setInterval(() => {
      setDuration((duration) => {
        if (duration >= 300) {
          setIsRecording(false);
        }
        return duration + 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRecording]);

  return (
    <div
      className={cn(
        `shadow-lg w-full aspect-square rounded-full text-primary-foreground flex items-center justify-center relative ${
          isRecording
            ? "bg-red-500 w-24 h-24"
            : " bg-primary opacity-80 w-20 h-20"
        }
      ${disabled ? "cursor-not-allowed" : "hover:opacity-100 cursor-pointer"}
      `,
        className
      )}
      onClick={() => {
        if (disabled) return;
        setIsRecording((isRecording) => !isRecording);
      }}
    >
      {isRecording ? (
        <div className="w-full my-auto text-center">
          <span className="font-mono text-xl font-bold">{duration}</span>
          <RecordButtonPopover
            onRecordEnd={(blob, duration) => {
              if (duration > 1000) {
                onRecordEnd(blob, duration);
              } else {
                toast({
                  description: t("recordTooShort"),
                  variant: "warning",
                });
              }
            }}
          />
          <RadialProgress
            className="w-24 h-24 absolute top-0 left-0"
            progress={100 - Math.floor((duration / 300) * 100)}
            ringClassName="text-white"
            circleClassName="text-red-500"
            thickness={6}
            label=" "
          />
        </div>
      ) : (
        <div className="flex items-center  justify-center space-x-4 h-10">
          <MicIcon className="w-10 h-10" />
        </div>
      )}
    </div>
  );
};

const RecordButtonPopover = (props: {
  onRecordEnd: (blob: Blob, duration: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>();

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#fff",
      height: 16,
      autoCenter: false,
      normalize: true,
    });

    const record = ws.registerPlugin(RecordPlugin.create());
    let startAt = 0;

    record.on("record-start", () => {
      startAt = Date.now();
    });

    record.on("record-end", (blob: Blob) => {
      const duration = Date.now() - startAt;
      props.onRecordEnd(blob, duration);
    });

    RecordPlugin.getAvailableAudioDevices()
      .then((devices) => devices.find((d) => d.kind === "audioinput"))
      .then((device) => record.startRecording({ deviceId: device.deviceId }));

    return () => {
      record.stopRecording();
      ws.destroy();
    };
  }, []);

  return (
    <div className="hidden">
      <div ref={containerRef}></div>
    </div>
  );
};
