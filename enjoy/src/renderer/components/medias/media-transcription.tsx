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
  toast,
} from "@renderer/components/ui";
import React, { useEffect, useContext, useState } from "react";
import { t } from "i18next";
import { LoaderIcon, CheckCircleIcon, MicIcon } from "lucide-react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { fetchFile } from "@ffmpeg/util";

export const MediaTranscription = (props: {
  transcription: TranscriptionType;
  mediaId: string;
  mediaType: "Audio" | "Video";
  mediaName?: string;
  mediaUrl: string;
  currentSegmentIndex?: number;
  onSelectSegment?: (index: number) => void;
}) => {
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp, ffmpeg } = useContext(AppSettingsProviderContext);
  const {
    transcription,
    mediaId,
    mediaType,
    mediaName,
    mediaUrl,
    currentSegmentIndex,
    onSelectSegment,
  } = props;
  const containerRef = React.createRef<HTMLDivElement>();
  const [transcoding, setTranscoding] = useState<boolean>(false);

  const [recordingStats, setRecordingStats] =
    useState<SegementRecordingStatsType>([]);

  const generate = async () => {
    const data = await transcode();
    let blob;
    if (data) {
      blob = {
        type: data.type.split(";")[0],
        arrayBuffer: await data.arrayBuffer(),
      };
    }

    EnjoyApp.transcriptions.process(
      {
        targetId: mediaId,
        targetType: mediaType,
      },
      {
        blob,
      }
    );
  };

  const transcode = async () => {
    if (!ffmpeg?.loaded) return;
    if (transcoding) return;

    try {
      setTranscoding(true);
      const uri = new URL(mediaUrl);
      const input = uri.pathname.split("/").pop();
      const output = input.replace(/\.[^/.]+$/, ".wav");
      await ffmpeg.writeFile(input, await fetchFile(mediaUrl));
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
      setTranscoding(false);
      return new Blob([data], { type: "audio/wav" });
    } catch (e) {
      setTranscoding(false);
      toast.error(t("transcodeError"));
    }
  };

  const fetchSegmentStats = async () => {
    if (!mediaId) return;

    EnjoyApp.recordings.groupBySegment(mediaId, mediaType).then((stats) => {
      setRecordingStats(stats);
    });
  };

  useEffect(() => {
    addDblistener(fetchSegmentStats);
    fetchSegmentStats();

    if (transcription?.state == "pending") {
      generate();
    }

    return () => {
      removeDbListener(fetchSegmentStats);
    };
  }, [mediaId, mediaType]);

  useEffect(() => {
    containerRef.current
      ?.querySelector(`#segment-${currentSegmentIndex}`)
      ?.scrollIntoView({
        block: "center",
        inline: "center",
      } as ScrollIntoViewOptions);
  }, [currentSegmentIndex, transcription]);

  if (!transcription)
    return (
      <div className="p-4 w-full">
        <TranscriptionPlaceholder />
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex items-cener justify-between">
        <div className="flex items-center space-x-2">
          {transcoding || transcription.state === "processing" ? (
            <PingPoint colorClassName="bg-yellow-500" />
          ) : transcription.state === "finished" ? (
            <CheckCircleIcon className="text-green-500 w-4 h-4" />
          ) : (
            <PingPoint colorClassName="bg-mute" />
          )}
          <span className="capitalize">{t("transcript")}</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={transcoding || transcription.state === "processing"}
              className="capitalize"
            >
              {(transcoding || transcription.state === "processing") && (
                <LoaderIcon className="animate-spin w-4 mr-2" />
              )}
              {transcription.result ? t("regenerate") : t("transcribe")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("transcribe")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("transcribeAudioConfirmation", {
                  name: mediaName,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={generate}>
                {t("transcribe")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {transcription?.result ? (
        <ScrollArea ref={containerRef} className="flex-1 px-2">
          {transcription.result.map((t, index) => (
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
                    (s) => s.referenceId === index
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
