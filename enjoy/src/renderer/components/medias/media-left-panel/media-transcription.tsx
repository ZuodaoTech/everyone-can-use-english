import { useEffect, useContext, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  DbProviderContext,
  MediaShadowProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import {
  Button,
  PingPoint,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  toast,
} from "@renderer/components/ui";
import {
  LoaderIcon,
  CheckCircleIcon,
  MicIcon,
  PencilLineIcon,
  SquareMenuIcon,
  GaugeCircleIcon,
} from "lucide-react";
import { AlignmentResult } from "echogarden/dist/api/API.d.js";
import { formatDuration } from "@renderer/lib/utils";
import {
  MediaTranscriptionReadButton,
  MediaTranscriptionGenerateButton,
  MediaTranscriptionPrint,
  TranscriptionEditButton,
} from "@renderer/components";
import { Sentence } from "@renderer/components";
import { useCopyToClipboard } from "@uidotdev/usehooks";

export const MediaTranscription = (props: { display?: boolean }) => {
  const { display } = props;
  const containerRef = useRef<HTMLDivElement>();
  const {
    decoded,
    media,
    currentSegmentIndex,
    wavesurfer,
    setCurrentSegmentIndex,
    transcription,
    transcribing,
    transcribingProgress,
  } = useContext(MediaShadowProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);

  const [recordingStats, setRecordingStats] =
    useState<SegementRecordingStatsType>([]);

  const [notesStats, setNotesStats] = useState<
    {
      targetId: string;
      targetType: string;
      count: number;
      segment: SegmentType;
    }[]
  >([]);
  const [_, copyToClipboard] = useCopyToClipboard();

  const fetchSegmentStats = async () => {
    if (!media) return;

    EnjoyApp.recordings
      .groupBySegment(media.id, media.mediaType)
      .then((stats) => {
        setRecordingStats(stats);
      });

    EnjoyApp.notes.groupBySegment(media.id, media.mediaType).then((stats) => {
      setNotesStats(stats);
    });
  };

  const scrollToCurrentSegment = () => {
    if (!containerRef?.current) return;
    if (!decoded) return;
    if (!display) return;

    setTimeout(() => {
      containerRef.current
        ?.querySelector(`#segment-${currentSegmentIndex}`)
        ?.scrollIntoView({
          block: "center",
          inline: "center",
        } as ScrollIntoViewOptions);
    }, 300);
  };

  const handleCopyFullText = () => {
    if (!transcription?.result) return;
    const fullText = (transcription.result as AlignmentResult).timeline
      .map((s) => s.text)
      .join("\n\n");
    copyToClipboard(fullText);
    toast.success(t("copied"));
  };

  useEffect(() => {
    if (!transcription?.result) return;

    addDblistener(fetchSegmentStats);
    fetchSegmentStats();

    return () => {
      removeDbListener(fetchSegmentStats);
    };
  }, [transcription?.result]);

  useEffect(() => {
    scrollToCurrentSegment();
  }, [display, decoded, currentSegmentIndex, transcription, containerRef]);

  if (!transcription?.result?.timeline) {
    return null;
  }

  return (
    <div ref={containerRef} data-testid="media-transcription-result">
      <div className="px-4 py-0.5 bg-background">
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
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <SquareMenuIcon className="w-5 h-5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-36">
                <DropdownMenuItem asChild>
                  <MediaTranscriptionReadButton>
                    <Button variant="ghost" className="block w-full">
                      {t("readThrough")}
                    </Button>
                  </MediaTranscriptionReadButton>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <MediaTranscriptionGenerateButton>
                    <Button
                      variant="ghost"
                      className="w-full"
                      disabled={transcribing}
                    >
                      {(transcribing ||
                        transcription.state === "processing") && (
                        <LoaderIcon className="animate-spin w-4 mr-2" />
                      )}
                      <span>
                        {transcription.result
                          ? t("regenerate")
                          : t("transcribe")}
                      </span>
                    </Button>
                  </MediaTranscriptionGenerateButton>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <TranscriptionEditButton>
                    <Button variant="ghost" className="block w-full">
                      {t("edit")}
                    </Button>
                  </TranscriptionEditButton>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <MediaTranscriptionPrint />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="block w-full"
                    onClick={handleCopyFullText}
                  >
                    {t("copyFullText")}
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {(transcription.result as AlignmentResult).timeline.map(
        (sentence, index) => (
          <div
            key={index}
            id={`segment-${index}`}
            className={`py-1.5 px-4 cursor-pointer hover:bg-yellow-400/10 ${
              currentSegmentIndex === index ? "bg-yellow-400/25" : ""
            }`}
            onClick={() => {
              wavesurfer.setTime(parseFloat(sentence.startTime.toFixed(6)));
              wavesurfer.setScrollTime(sentence.startTime);
              setCurrentSegmentIndex(index);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-50">#{index + 1}</span>
              <div className="flex items-center space-x-2">
                <RecordingStatsRemark
                  stats={recordingStats}
                  referenceId={index}
                />
                {(notesStats || []).findIndex(
                  (s) => s.segment?.segmentIndex === index
                ) !== -1 && <PencilLineIcon className="w-3 h-3 text-sky-500" />}
                <span className="text-xs opacity-50">
                  {formatDuration(sentence.startTime, "s")}
                </span>
              </div>
            </div>

            <Sentence className="font-serif" sentence={sentence.text} />
          </div>
        )
      )}
    </div>
  );
};

const RecordingStatsRemark = (props: {
  stats: SegementRecordingStatsType;
  referenceId: number;
}) => {
  const { stats = [], referenceId } = props;
  const stat = stats.find((s) => s.referenceId === referenceId);
  if (!stat) return null;

  return (
    <>
      {stat.pronunciationAssessment?.pronunciationScore && (
        <GaugeCircleIcon
          className={`w-3 h-3
                    ${
                      stat.pronunciationAssessment
                        ? stat.pronunciationAssessment.pronunciationScore >= 80
                          ? "text-green-500"
                          : stat.pronunciationAssessment.pronunciationScore >=
                            60
                          ? "text-yellow-600"
                          : "text-red-500"
                        : ""
                    }
                    `}
        />
      )}
      <MicIcon className="w-3 h-3 text-sky-500" />
    </>
  );
};
