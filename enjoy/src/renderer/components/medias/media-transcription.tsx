import { useEffect, useContext, useRef, useState } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import { t } from "i18next";
import {
  Button,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  PingPoint,
  ScrollArea,
} from "@renderer/components/ui";
import { LoaderIcon, CheckCircleIcon, MicIcon } from "lucide-react";
import { AlignmentResult } from "echogarden/dist/api/API.d.js";

export const MediaTranscription = () => {
  const containerRef = useRef<HTMLDivElement>();
  const {
    media,
    currentSegmentIndex,
    wavesurfer,
    setCurrentSegmentIndex,
    transcription,
    generateTranscription,
    transcribing,
    transcribingProgress,
  } = useContext(MediaPlayerProviderContext);

  useEffect(() => {
    if (!containerRef?.current) return;

    containerRef.current
      ?.querySelector(`#segment-${currentSegmentIndex}`)
      ?.scrollIntoView({
        block: "center",
        inline: "center",
      } as ScrollIntoViewOptions);
  }, [currentSegmentIndex, transcription, containerRef]);

  if (!transcription?.result) {
    return null;
  }

  return (
    <ScrollArea
      ref={containerRef}
      className="border rounded-lg shadow-lg"
      data-testid="media-transcription-result"
    >
      <div className="sticky top-0 px-4 py-2 bg-background z-10">
        <div className="flex items-cener justify-between">
          <div className="flex items-center space-x-2">
            {transcribing || transcription.state === "processing" ? (
              <>
                <PingPoint colorClassName="bg-yellow-500" />
                <div className="text-sm">
                  {transcribingProgress > 0 && `${transcribingProgress}%`}
                </div>
              </>
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
                variant="outline"
                disabled={transcribing || transcription.state === "processing"}
                className="capitalize"
              >
                {(transcribing || transcription.state === "processing") && (
                  <LoaderIcon className="animate-spin w-4 mr-2" />
                )}
                {transcription.result ? t("regenerate") : t("transcribe")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("transcribe")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("transcribeMediaConfirmation", {
                    name: media.name,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={generateTranscription}>
                  {t("transcribe")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {(transcription.result as AlignmentResult).timeline.map(
        (sentence, index) => (
          <div
            key={index}
            id={`segment-${index}`}
            className={`py-2 px-4 cursor-pointer hover:bg-yellow-400/10 ${
              currentSegmentIndex === index ? "bg-yellow-400/25" : ""
            }`}
            onClick={() => {
              wavesurfer.seekTo(
                Math.floor((sentence.startTime / media.duration) * 1000) / 1000
              );
              wavesurfer.setScrollTime(sentence.startTime);
              setCurrentSegmentIndex(index);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-50">#{index + 1}</span>
            </div>
            <p className="">{sentence.text}</p>
          </div>
        )
      )}
    </ScrollArea>
  );
};
