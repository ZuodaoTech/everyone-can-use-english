import { useEffect, useContext, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { MediaRecorder, RecordingDetail } from "@renderer/components";
import { renderPitchContour } from "@renderer/lib/utils";
import { extractFrequencies } from "@/utils";
import WaveSurfer from "wavesurfer.js";
import Regions from "wavesurfer.js/dist/plugins/regions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  toast,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@renderer/components/ui";
import {
  GitCompareIcon,
  PauseIcon,
  PlayIcon,
  Share2Icon,
  GaugeCircleIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  TextCursorInputIcon,
} from "lucide-react";
import { t } from "i18next";
import { formatDuration } from "@renderer/lib/utils";
import { useHotkeys } from "react-hotkeys-hook";

export const MediaCurrentRecording = (props: { height?: number }) => {
  const { height = 192 } = props;
  const {
    isRecording,
    currentRecording,
    renderPitchContour: renderMediaPitchContour,
    regions: mediaRegions,
    wavesurfer,
    zoomRatio,
    editingRegion,
  } = useContext(MediaPlayerProviderContext);
  const { webApi, EnjoyApp } = useContext(AppSettingsProviderContext);
  const [player, setPlayer] = useState(null);
  const [regions, setRegions] = useState<Regions | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const [detailIsOpen, setDetailIsOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);

  const [frequencies, setFrequencies] = useState<number[]>([]);
  const [peaks, setPeaks] = useState<number[]>([]);

  const ref = useRef(null);

  const removeComparingPitchContour = () => {
    if (!wavesurfer) return;

    const wrapper = (wavesurfer as any).renderer.getWrapper();
    wrapper
      .querySelectorAll(".pitch-contour-recording")
      .forEach((el: HTMLDivElement) => el.remove());
  };

  /*
   * Render recording's pitch contour on the original audio waveform
   * with the original pitch contour.
   */
  const renderComparingPitchContour = () => {
    const region = mediaRegions
      .getRegions()
      .find((r) => r.id.startsWith("segment-region"));
    if (!region) return;

    if (!frequencies || !peaks) return;

    // Trim the peaks from start to end, so we can render the voicable part of the recording
    const minValue = 0.05;
    let voiceStartIndex = 0;
    let voiceEndIndex = peaks.length - 1;

    for (let i = 1; i < voiceEndIndex; i++) {
      if (peaks[i] >= minValue) {
        voiceStartIndex = i;
        break;
      }
    }
    for (let i = voiceEndIndex; i > voiceStartIndex; i--) {
      if (peaks[i] >= minValue) {
        voiceEndIndex = i;
        break;
      }
    }
    voiceStartIndex = Math.round(
      ((1.0 * voiceStartIndex) / peaks.length) * frequencies.length
    );
    voiceEndIndex = Math.round(
      ((1.0 * voiceEndIndex) / peaks.length) * frequencies.length
    );

    renderMediaPitchContour(region, {
      repaint: false,
      canvasId: `pitch-contour-${currentRecording.id}-canvas`,
      containerClassNames: ["pitch-contour-recording"],
      data: {
        labels: new Array(frequencies.length).fill(""),
        datasets: [
          {
            data: frequencies.slice(voiceStartIndex, voiceEndIndex),
            cubicInterpolationMode: "monotone",
            borderColor: "#fb6f92",
            pointBorderColor: "#fb6f92",
            pointBackgroundColor: "#ff8fab",
          },
        ],
      },
    });
  };

  const toggleCompare = () => {
    if (isComparing) {
      removeComparingPitchContour();
      setIsComparing(false);
    } else {
      setIsComparing(true);
      renderComparingPitchContour();
    }
  };

  const handleShare = async () => {
    if (!currentRecording.uploadedAt) {
      try {
        await EnjoyApp.recordings.upload(currentRecording.id);
      } catch (error) {
        toast.error(t("shareFailed"), { description: error.message });
        return;
      }
    }

    webApi
      .createPost({
        targetId: currentRecording.id,
        targetType: "Recording",
      })
      .then(() => {
        toast.success(t("sharedSuccessfully"), {
          description: t("sharedRecording"),
        });
      })
      .catch((error) => {
        toast.error(t("shareFailed"), {
          description: error.message,
        });
      });
  };

  useEffect(() => {
    if (!ref.current) return;
    if (isRecording) return;
    if (!currentRecording?.src) return;

    const ws = WaveSurfer.create({
      container: ref.current,
      url: currentRecording.src,
      height,
      barWidth: 2,
      cursorWidth: 1,
      autoCenter: true,
      autoScroll: true,
      minPxPerSec: 150,
      waveColor: "#efefef",
      normalize: false,
      progressColor: "rgba(0, 0, 0, 0.1)",
    });

    setPlayer(ws);

    const regions = ws.registerPlugin(Regions.create());
    setRegions(regions);

    ws.on("timeupdate", (time: number) => setCurrentTime(time));

    ws.on("finish", () => ws.seekTo(0));

    ws.on("ready", () => {
      const peaks: Float32Array = ws.getDecodedData().getChannelData(0);
      const sampleRate = ws.options.sampleRate;
      const data = extractFrequencies({ peaks, sampleRate });
      setFrequencies(data);
      setPeaks(Array.from(peaks));

      renderPitchContour({
        wrapper: ws.getWrapper(),
        canvasId: `pitch-contour-${currentRecording.id}-canvas`,
        labels: new Array(data.length).fill(""),
        datasets: [
          {
            data,
            cubicInterpolationMode: "monotone",
            borderColor: "#fb6f92",
            pointBorderColor: "#fb6f92",
            pointBackgroundColor: "#ff8fab",
          },
        ],
      });
    });

    return () => {
      ws.destroy();
    };
  }, [ref, currentRecording, isRecording]);

  useEffect(() => {
    setIsComparing(false);
    removeComparingPitchContour();
  }, [currentRecording]);

  useEffect(() => {
    if (!isComparing) return;

    if (editingRegion) {
      setIsComparing(false);
    } else {
      setTimeout(() => {
        renderComparingPitchContour();
      }, 100);
    }
  }, [zoomRatio, editingRegion]);

  useEffect(() => {
    if (!regions) return;

    let disableSelectingRegion: () => void | undefined;
    if (isSelectingRegion) {
      regions.clearRegions();
      disableSelectingRegion = regions.enableDragSelection({
        color: "rgba(76, 201, 240, 0.2)",
        drag: false,
      });
    }

    const subscriptions = [
      regions.on("region-created", () => {}),

      regions.on("region-clicked", (region, e) => {
        e.stopPropagation();
        region.play();
      }),

      regions.on("region-out", () => {
        player.pause();
      }),
    ];

    return () => {
      disableSelectingRegion && disableSelectingRegion();
      regions.clearRegions();
      subscriptions.forEach((unsub) => unsub());
    };
  }, [regions, isSelectingRegion]);

  /*
   * Update player styles
   */
  useEffect(() => {
    if (!ref?.current || !player) return;

    const scrollContainer = player.getWrapper()?.closest(".scroll");
    if (!scrollContainer) return;

    scrollContainer.style.width = `${
      ref.current.getBoundingClientRect().width
    }px`;
    scrollContainer.style.scrollbarWidth = "thin";
  }, [ref, player]);

  useHotkeys(
    ["Ctrl+R", "Meta+R"],
    (keyboardEvent, hotkeyEvent) => {
      if (!player) return;
      keyboardEvent.preventDefault();

      if (
        (navigator.platform.includes("Mac") && hotkeyEvent.meta) ||
        hotkeyEvent.ctrl
      ) {
        document.getElementById("recording-play-or-pause-button").click();
      }
    },
    [player]
  );

  if (isRecording) return <MediaRecorder />;
  if (!currentRecording?.src)
    return (
      <div className="h-full w-full border rounded-xl shadow-lg flex items-center justify-center">
        <div
          className="m-auto"
          dangerouslySetInnerHTML={{
            __html: t("noRecordingForThisSegmentYet"),
          }}
        ></div>
      </div>
    );

  return (
    <div className="flex space-x-4">
      <div className="border rounded-xl shadow-lg flex-1 relative">
        <div ref={ref}></div>

        <div className="absolute right-2 top-1">
          <span className="text-sm">{formatDuration(currentTime || 0)}</span>
          <span className="mx-1">/</span>
          <span className="text-sm">
            {formatDuration(
              player?.getDuration() || currentRecording.duration / 1000.0 || 0
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col space-y-1.5">
        <Button
          variant="default"
          size="icon"
          id="recording-play-or-pause-button"
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("playRecording")}
          className="rounded-full w-8 h-8 p-0"
          onClick={() => player?.playPause()}
        >
          {player?.isPlaying() ? (
            <PauseIcon className="w-4 h-4" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant={isComparing ? "secondary" : "outline"}
          size="icon"
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("compare")}
          className="rounded-full w-8 h-8 p-0"
          onClick={toggleCompare}
        >
          <GitCompareIcon className="w-4 h-4" />
        </Button>

        <Button
          variant={isSelectingRegion ? "secondary" : "outline"}
          size="icon"
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("selectRegion")}
          className="rounded-full w-8 h-8 p-0"
          onClick={() => setIsSelectingRegion(!isSelectingRegion)}
        >
          <TextCursorInputIcon className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              data-tooltip-id="media-player-controls-tooltip"
              data-tooltip-content={t("more")}
              className="rounded-full w-8 h-8 p-0"
            >
              <MoreVerticalIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setDetailIsOpen(true)}
            >
              <GaugeCircleIcon
                className={`w-4 h-4 mr-4
                    ${
                      currentRecording.pronunciationAssessment
                        ? currentRecording.pronunciationAssessment
                            .pronunciationScore >= 80
                          ? "text-green-500"
                          : currentRecording.pronunciationAssessment
                              .pronunciationScore >= 60
                          ? "text-yellow-600"
                          : "text-red-500"
                        : ""
                    }
                    `}
              />
              <span>{t("pronunciationAssessment")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setIsSharing(true)}
            >
              <Share2Icon className="w-4 h-4 mr-4" />
              <span>{t("share")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isSharing} onOpenChange={setIsSharing}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shareRecording")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureToShareThisRecordingToCommunity")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleShare}>{t("share")}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet open={detailIsOpen} onOpenChange={(open) => setDetailIsOpen(open)}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl shadow-lg"
          displayClose={false}
        >
          <SheetHeader className="flex items-center justify-center -mt-4 mb-2">
            <SheetClose>
              <ChevronDownIcon />
            </SheetClose>
          </SheetHeader>

          <RecordingDetail recording={currentRecording} />
        </SheetContent>
      </Sheet>
    </div>
  );
};
