import { t } from "i18next";
import { MicIcon, LockIcon } from "lucide-react";
import { useState, useEffect, useRef, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import WaveSurfer from "wavesurfer.js";
import { cn } from "@renderer/lib/utils";
import { RadialProgress, toast } from "@renderer/components/ui";
import { useHotkeys } from "react-hotkeys-hook";
import { fetchFile } from "@ffmpeg/util";

export const RecordButton = (props: {
  className?: string;
  disabled: boolean;
  onRecordBegin?: () => void;
  onRecordEnd: (blob: Blob, duration: number) => void;
}) => {
  const { className, disabled, onRecordBegin, onRecordEnd } = props;
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [access, setAccess] = useState<boolean>(false);

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

  useEffect(() => {
    askForMediaAccess();
  }, []);

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
        if (access) {
          setIsRecording((isRecording) => !isRecording);
        } else {
          askForMediaAccess();
        }
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
                toast.warning(t("recordTooShort"));
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
          {!access && (
            <LockIcon className="w-4 h-4 absolute right-3 bottom-4" />
          )}
        </div>
      )}
    </div>
  );
};

const RecordButtonPopover = (props: {
  onRecordEnd: (blob: Blob, duration: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>();
  const { ffmpeg } = useContext(AppSettingsProviderContext);

  const transcode = async (blob: Blob) => {
    const input = `input.${blob.type.split("/")[1]}`;
    const output = input.replace(/\.[^/.]+$/, ".wav");
    await ffmpeg.writeFile(input, await fetchFile(blob));
    await ffmpeg.exec([
      "-i",
      input,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      output,
    ]);
    const data = await ffmpeg.readFile(output);
    return new Blob([data], { type: "audio/wav" });
  };

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

    record.on("record-end", async (blob: Blob) => {
      const duration = Date.now() - startAt;
      const output = await transcode(blob);
      props.onRecordEnd(output, duration);
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
