import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Skeleton,
  ScrollArea,
  Button,
  PingPoint,
} from "@renderer/components/ui";
import React, { useEffect, useContext } from "react";
import { t } from "i18next";
import { LoaderIcon, CheckCircleIcon, MicIcon } from "lucide-react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";

export const AudioTranscription = (props: {
  audio: AudioType | null;
  currentSegmentIndex?: number;
  onSelectSegment?: (index: number) => void;
}) => {
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { audio, currentSegmentIndex, onSelectSegment } = props;
  const containerRef = React.createRef<HTMLDivElement>();

  const [recordingStats, setRecordingStats] =
    React.useState<SegementRecordingStatsType>([]);

  const regenerate = async () => {
    if (!audio) return;

    EnjoyApp.audios.transcribe(audio.id);
  };

  const fetchSegmentStats = async () => {
    if (!audio) return;

    EnjoyApp.recordings.groupBySegment(audio.id).then((stats) => {
      setRecordingStats(stats);
    });
  };

  useEffect(() => {
    addDblistener(fetchSegmentStats);
    fetchSegmentStats();

    return () => {
      removeDbListener(fetchSegmentStats);
    };
  }, [audio]);

  useEffect(() => {
    containerRef.current
      ?.querySelector(`#segment-${currentSegmentIndex}`)
      ?.scrollIntoView({
        block: "center",
        inline: "center",
      } as ScrollIntoViewOptions);
  }, [currentSegmentIndex, audio?.transcription]);

  if (!audio)
    return (
      <div className="p-4 w-full">
        <TranscriptionPlaceholder />
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex items-cener justify-between">
        <div className="flex items-center space-x-2">
          {audio.transcribing ? (
            <PingPoint colorClassName="bg-yellow-500" />
          ) : audio.isTranscribed ? (
            <CheckCircleIcon className="text-green-500 w-4 h-4" />
          ) : (
            <PingPoint colorClassName="bg-mute" />
          )}
          <span className="">{t("transcription")}</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={audio.transcribing} className="capitalize">
              {audio.transcribing && (
                <LoaderIcon className="animate-spin w-4 mr-2" />
              )}
              {audio.isTranscribed ? t("regenerate") : t("transcribe")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("transcribe")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("transcribeAudioConfirmation", {
                  name: audio.name,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive"
                onClick={regenerate}
              >
                {t("transcribe")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {audio.transcription ? (
        <ScrollArea ref={containerRef} className="flex-1">
          {audio.transcription.map((t, index) => (
            <div
              key={index}
              id={`segment-${index}`}
              className={`py-1 px-2 mb-2 cursor-pointer hover:bg-yellow-400/25 ${
                currentSegmentIndex === index ? "bg-yellow-400/25" : ""
              }`}
              onClick={() => {
                onSelectSegment?.(index);
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-50">#{index + 1}</span>

                <div className="flex items-center space-x-2">
                  {(recordingStats || []).findIndex(
                    (s) => s.segmentIndex === index
                  ) !== -1 && <MicIcon className="w-3 h-3 text-sky-500" />}
                  <span className="text-xs opacity-50">
                    {t.timestamps.from.split(",")[0]}
                  </span>
                </div>
              </div>
              <p className="">{t.text}</p>
            </div>
          ))}
        </ScrollArea>
      ) : (
        <TranscriptionPlaceholder />
      )}
    </div>
  );
};

export const TranscriptionPlaceholder = () => {
  return (
    <div className="p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full mb-4" />
      ))}
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
};
