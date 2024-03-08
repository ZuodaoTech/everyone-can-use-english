import { useEffect, useState, useContext, useRef } from "react";
import { type Region as RegionType } from "wavesurfer.js/dist/plugins/regions";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Separator,
} from "@renderer/components/ui";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import {
  ScissorsIcon,
  PlayIcon,
  PauseIcon,
  Repeat1Icon,
  RepeatIcon,
  GaugeIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MicIcon,
  MinimizeIcon,
  GalleryHorizontalIcon,
  SpellCheckIcon,
  Share2Icon,
  ListRestartIcon,
  SkipForwardIcon,
  SkipBackIcon,
  SquareIcon,
} from "lucide-react";
import { t } from "i18next";
import { secondsToTimestamp } from "@renderer/lib/utils";
import Chart from "chart.js/auto";
import { Tooltip } from "react-tooltip";
import { useHotkeys } from "react-hotkeys-hook";
import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";

const PLAYBACK_RATE_OPTIONS = [0.75, 0.8, 0.9, 1.0];
const ZOOM_RATIO_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const MIN_ZOOM_RATIO = 0.25;
const MAX_ZOOM_RATIO = 2.0;
export const AudioPlayerControls = () => {
  const {
    media,
    decoded,
    wavesurfer,
    currentTime,
    currentSegmentIndex,
    setCurrentSegmentIndex,
    fitZoomRatio,
    transcription,
    waveform,
    regions,
    minPxPerSec,
    isRecording,
    setIsRecording,
  } = useContext(MediaPlayerProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [playMode, setPlayMode] = useState<"loop" | "single" | "all">("single");
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [zoomRatio, setZoomRatio] = useState<number>(1.0);
  const [activeRegion, setActiveRegion] = useState<RegionType>(null);
  const [displayInlineCaption, setDisplayInlineCaption] =
    useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [pitchChart, setPitchChart] = useState<Chart>(null);
  const [transcriptionDraft, setTranscriptionDraft] =
    useState<TranscriptionType["result"]>();

  const playOrPause = () => {
    if (!wavesurfer) return;

    if (wavesurfer.isPlaying()) {
      wavesurfer.pause();
    } else {
      if (
        activeRegion &&
        (currentTime < activeRegion.start || currentTime > activeRegion.end)
      ) {
        wavesurfer.seekTo(activeRegion.start / wavesurfer.getDuration());
      }
      wavesurfer.play();
    }
  };

  const onPrev = () => {
    if (!wavesurfer) return;
    const segment = transcription?.result[currentSegmentIndex - 1];
    if (!segment) return;

    setCurrentSegmentIndex(currentSegmentIndex - 1);
  };

  const onNext = () => {
    if (!wavesurfer) return;
    const segment = transcription?.result[currentSegmentIndex + 1];
    if (!segment) return;

    setCurrentSegmentIndex(currentSegmentIndex + 1);
  };

  const updateSegmentRegion = () => {
    if (!wavesurfer) return;
    if (!regions) return;

    const currentSegment = transcription?.result?.[currentSegmentIndex];
    if (!currentSegment) return;

    const id = `segment-region-${currentSegmentIndex}`;
    const from = currentSegment.offsets.from / 1000.0;
    const to = currentSegment.offsets.to / 1000.0;

    const span = document.createElement("span");
    span.innerText = `#${currentSegmentIndex + 1} (${(to - from).toFixed(2)}s)`;
    span.style.padding = "1rem";
    span.style.fontSize = "0.9rem";

    regions.clearRegions();
    const region = regions.addRegion({
      id,
      start: from,
      end: to,
      color: "rgba(255, 0, 0, 0.03)",
      drag: false,
      resize: editing,
      content: span,
    });
    setActiveRegion(region);
    wavesurfer.setScrollTime(region.start);
    renderPitchContour(region);
  };

  const debouncedUpdateSegmentRegion = debounce(updateSegmentRegion, 100);

  const renderPitchContour = (region: RegionType) => {
    if (!region) return;
    if (!waveform?.frequencies?.length) return;
    if (!wavesurfer) return;
    const height = 250;

    const duration = wavesurfer.getDuration();
    const fromIndex = Math.round(
      (region.start / duration) * waveform.frequencies.length
    );
    const toIndex = Math.round(
      (region.end / duration) * waveform.frequencies.length
    );

    const wrapper = (wavesurfer as any).renderer.getWrapper();
    // remove existing pitch contour
    wrapper
      .querySelectorAll(".pitch-contour")
      .forEach((element: HTMLDivElement) => {
        element.remove();
      });

    // calculate offset and width
    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const offsetLeft = (region.start / duration) * wrapperWidth;
    const width = ((region.end - region.start) / duration) * wrapperWidth;

    // create container and canvas
    const containerId = `pitch-contour-${region.id}`;
    const pitchContourWidthContainer = document.createElement("div");
    const canvas = document.createElement("canvas");
    const canvasId = `pitch-contour-${region.id}-canvas`;
    canvas.id = canvasId;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    pitchContourWidthContainer.appendChild(canvas);

    pitchContourWidthContainer.style.position = "absolute";
    pitchContourWidthContainer.style.top = "0";
    pitchContourWidthContainer.style.left = "0";

    pitchContourWidthContainer.style.width = `${width}px`;
    pitchContourWidthContainer.style.height = `${height}px`;
    pitchContourWidthContainer.style.marginLeft = `${offsetLeft}px`;
    pitchContourWidthContainer.className = "pitch-contour";
    pitchContourWidthContainer.id = containerId;

    wrapper.appendChild(pitchContourWidthContainer);

    // render pitch contour
    const data = waveform.frequencies.slice(fromIndex, toIndex);
    const labels = new Array(data.length).fill("");
    const regionDuration = region.end - region.start;

    const caption = transcription?.result?.[currentSegmentIndex];
    if (region.id.startsWith("segment-region")) {
      caption.segments.forEach((segment) => {
        const index = Math.round(
          ((segment.offsets.from / 1000 - region.start) / regionDuration) *
            data.length
        );
        labels[index] = segment.text.trim();
        if (!data[index]) {
          data[index] = 0;
        }
      });
    }

    setPitchChart(
      new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              data,
              cubicInterpolationMode: "monotone",
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: false,
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                autoSkip: false,
              },
              display: true,
              grid: {
                display: false,
              },
              border: {
                display: false,
              },
            },
            y: {
              display: false,
            },
          },
        },
      })
    );
  };

  /*
   * Update segmentRegion when currentSegmentIndex is updated
   */
  useEffect(() => {
    if (!regions) return;

    debouncedUpdateSegmentRegion();
  }, [currentSegmentIndex, regions, editing, transcription?.result]);

  /*
   * Update segmentRegion when currentSegmentIndex is updated
   */
  useEffect(() => {
    if (!wavesurfer) return;
    if (wavesurfer.isPlaying()) return;

    const segment = transcription?.result?.[currentSegmentIndex];
    if (!segment) return;

    wavesurfer.seekTo(segment.offsets.from / 1000.0 / wavesurfer.getDuration());
  }, [currentSegmentIndex, wavesurfer, transcription?.result]);

  /*
   * When regions are available,
   * set up event listeners for regions
   * and clean up when component is unmounted
   */
  useEffect(() => {
    if (!regions) return;
    if (!transcription?.result) return;

    const subscriptions = [
      wavesurfer.on("finish", () => {
        if (playMode !== "loop") return;

        activeRegion?.play();
      }),

      regions.on("region-updated", (region) => {
        if (region.id === `segment-region-${currentSegmentIndex}`) {
          const from = region.start;
          const to = region.end;

          const offsets = {
            from: Math.round(from * 1000),
            to: Math.round(to * 1000),
          };

          const timestamps = {
            from: [
              secondsToTimestamp(from),
              Math.round((from * 1000) % 1000),
            ].join(","),
            to: [secondsToTimestamp(to), Math.round((to * 1000) % 1000)].join(
              ","
            ),
          };

          const draft = cloneDeep(transcription.result);

          draft[currentSegmentIndex].offsets = offsets;
          draft[currentSegmentIndex].timestamps = timestamps;

          // ensure that the previous segment ends before the current segment
          if (
            currentSegmentIndex > 0 &&
            draft[currentSegmentIndex - 1].offsets.to > offsets.from
          ) {
            draft[currentSegmentIndex - 1].offsets.to = offsets.from;
          }

          // ensure that the next segment starts after the current segment
          if (
            currentSegmentIndex < draft.length - 1 &&
            draft[currentSegmentIndex + 1].offsets.from < offsets.to
          ) {
            draft[currentSegmentIndex + 1].offsets.from = offsets.to;
          }

          setTranscriptionDraft(draft);
          renderPitchContour(region);
        }
      }),

      regions.on("region-created", (region: RegionType) => {
        region.on("click", () => {
          wavesurfer.play();
        });
      }),

      regions.on("region-out", (region) => {
        if (playMode === "loop") {
          region.play();
        } else if (playMode === "single") {
          wavesurfer.pause();
          wavesurfer.seekTo(region.start / wavesurfer.getDuration());
        }
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [playMode, regions, transcription, currentSegmentIndex]);

  useEffect(() => {
    if (!transcription?.result) return;
    if (!decoded) return;
    if (!wavesurfer) return;

    setCurrentSegmentIndex(0);
    const segment = transcription.result[0];
    wavesurfer.seekTo(segment.offsets.from / 1000.0 / wavesurfer.getDuration());
  }, [decoded, transcription?.id, wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) return;
    if (!decoded) return;

    wavesurfer.zoom(zoomRatio * minPxPerSec);
    if (!activeRegion) return;

    renderPitchContour(activeRegion);
    wavesurfer.setScrollTime(activeRegion.start);
  }, [zoomRatio, wavesurfer, decoded]);

  useEffect(() => {
    if (!wavesurfer) return;

    wavesurfer.setPlaybackRate(playbackRate);
  }, [playbackRate, wavesurfer]);

  /*
   * Update currentSegmentIndex when currentTime is updated
   */
  useEffect(() => {
    if (!transcription?.result) return;

    const index = transcription.result.findIndex(
      (t) =>
        currentTime * 1000 >= t.offsets.from &&
        currentTime * 1000 < t.offsets.to
    );
    if (index === -1) return;
    // Stay on the current segment if playMode is single
    if (["single", "loop"].includes(playMode) && index !== currentSegmentIndex)
      return;

    setCurrentSegmentIndex(index);
  }, [currentTime, transcription?.result]);

  useHotkeys(
    "Space",
    (keyboardEvent, _hotkeyEvent) => {
      if (!wavesurfer) return;

      keyboardEvent.preventDefault();
      playOrPause();
    },
    [wavesurfer]
  );

  return (
    <div className="w-full h-20 flex items-center justify-between px-6">
      <div className="flex items-center justify-start space-x-6">
        <div className="flex items-center space-x-1">
          {wavesurfer?.isPlaying() ? (
            <Button
              variant="default"
              onClick={playOrPause}
              data-tooltip-id="media-player-controls-tooltip"
              data-tooltip-content={t("pause")}
              className="aspect-square p-0 h-12 rounded-full"
            >
              <PauseIcon fill="white" className="w-6 h-6" />
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={playOrPause}
              data-tooltip-id="media-player-controls-tooltip"
              data-tooltip-content={t("play")}
              className="aspect-square p-0 h-12 rounded-full"
            >
              <PlayIcon fill="white" className="w-6 h-6" />
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="lg"
            onClick={onPrev}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("playPreviousSegment")}
            className="aspect-square p-0 h-10"
          >
            <SkipBackIcon className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={onNext}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("playNextSegment")}
            className="aspect-square p-0 h-10"
          >
            <SkipForwardIcon className="w-6 h-6" />
          </Button>

          {playMode === "single" && (
            <Button
              variant="ghost"
              onClick={() => setPlayMode("loop")}
              data-tooltip-id="media-player-controls-tooltip"
              data-tooltip-content={t("playSingleSegment")}
              className="aspect-square p-0 h-10"
            >
              <RepeatIcon className="w-6 h-6" />
            </Button>
          )}
          {playMode === "loop" && (
            <Button
              variant="secondary"
              onClick={() => setPlayMode("all")}
              data-tooltip-id="media-player-controls-tooltip"
              data-tooltip-content={t("playInLoop")}
              className="aspect-square p-0 h-10"
            >
              <Repeat1Icon className="w-6 h-6" />
            </Button>
          )}
          {playMode === "all" && (
            <Button
              variant="ghost"
              onClick={() => setPlayMode("single")}
              data-tooltip-id="media-player-controls-tooltip"
              data-tooltip-content={t("playAllSegments")}
              className="aspect-square p-0 h-10"
            >
              <ListRestartIcon className="w-6 h-6" />
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={`${playbackRate == 1.0 ? "ghost" : "secondary"}`}
                data-tooltip-id="media-player-controls-tooltip"
                data-tooltip-content={t("playbackSpeed")}
                className="relative aspect-square p-0 h-10"
              >
                <GaugeIcon className="w-6 h-6" />
                {playbackRate != 1.0 && (
                  <span className="absolute left-[1.25rem] top-6 text-[0.6rem] font-bold text-gray-400">
                    {playbackRate.toFixed(2)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <div className="mb-4 text-center">{t("playbackRate")}</div>
              <div className="w-full rounded-full flex items-center justify-between bg-muted">
                {PLAYBACK_RATE_OPTIONS.map((rate, i) => (
                  <div
                    key={i}
                    className={`cursor-pointer h-10 w-10 leading-10 rounded-full flex items-center justify-center ${
                      rate === playbackRate
                        ? "bg-primary text-white text-md"
                        : "text-black/70 text-xs"
                    }`}
                    onClick={() => {
                      setPlaybackRate(rate);
                    }}
                  >
                    <span className="">{rate}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant={`${zoomRatio > 1.0 ? "secondary" : "ghost"}`}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("zoomIn")}
            className="relative aspect-square p-0 h-10"
            onClick={() => {
              if (zoomRatio < MAX_ZOOM_RATIO) {
                const nextZoomRatio = ZOOM_RATIO_OPTIONS.find(
                  (rate) => rate > zoomRatio
                );
                setZoomRatio(nextZoomRatio || MAX_ZOOM_RATIO);
              }
            }}
          >
            <ZoomInIcon className="w-6 h-6" />
          </Button>

          <Button
            variant={`${zoomRatio < 1.0 ? "secondary" : "ghost"}`}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("zoomOut")}
            className="relative aspect-square p-0 h-10"
            onClick={() => {
              if (zoomRatio > MIN_ZOOM_RATIO) {
                const nextZoomRatio = ZOOM_RATIO_OPTIONS.reverse().find(
                  (rate) => rate < zoomRatio
                );
                setZoomRatio(nextZoomRatio || MIN_ZOOM_RATIO);
              }
            }}
          >
            <ZoomOutIcon className="w-6 h-6" />
          </Button>

          <Button
            variant={`${zoomRatio === fitZoomRatio ? "secondary" : "ghost"}`}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("zoomToFit")}
            className="relative aspect-square p-0 h-10"
            onClick={() => {
              if (zoomRatio == fitZoomRatio) {
                setZoomRatio(1.0);
              } else {
                setZoomRatio(fitZoomRatio);
              }
            }}
          >
            <MinimizeIcon className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant={`${displayInlineCaption ? "secondary" : "ghost"}`}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("inlineCaption")}
            className="relative aspect-square p-0 h-10"
            onClick={() => {
              setDisplayInlineCaption(!displayInlineCaption);
              if (pitchChart) {
                pitchChart.options.scales.x.display = !displayInlineCaption;
                pitchChart.update();
              }
            }}
          >
            <SpellCheckIcon className="w-6 h-6" />
          </Button>

          <Button
            variant={`${
              wavesurfer?.options?.autoCenter ? "secondary" : "ghost"
            }`}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("autoCenter")}
            className="relative aspect-square p-0 h-10"
            onClick={() => {
              wavesurfer.setOptions({
                autoCenter: !wavesurfer?.options?.autoCenter,
              });
            }}
          >
            <GalleryHorizontalIcon className="w-6 h-6" />
          </Button>

          <Button
            variant={`${editing ? "secondary" : "ghost"}`}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("editRegion")}
            className="relative aspect-square p-0 h-10"
            onClick={() => {
              setEditing(!editing);
            }}
          >
            <ScissorsIcon className="w-6 h-6" />
          </Button>
        </div>

        {editing && (
          <div className="flex items-center space-x-1">
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(false);
                setTranscriptionDraft(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (!transcriptionDraft) return;

                EnjoyApp.transcriptions
                  .update(transcription.id, {
                    result: transcriptionDraft,
                  })
                  .then(() => {
                    setTranscriptionDraft(null);
                    setEditing(false);
                  });
              }}
            >
              {t("save")}
            </Button>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center space-x-6">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("playRecording")}
            className="aspect-square p-0 h-10"
          >
            <PlayIcon className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            onClick={() => setIsRecording(!isRecording)}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={
              isRecording ? t("stopRecording") : t("startRecording")
            }
            className="aspect-square p-0 h-12 rounded-full bg-red-500 hover:bg-red-500/90"
          >
            {isRecording ? (
              <SquareIcon fill="white" className="w-6 h-6 text-white" />
            ) : (
              <MicIcon className="w-6 h-6 text-white" />
            )}
          </Button>
        </div>
      </div>

      <Tooltip className="z-10" id="media-player-controls-tooltip" />
    </div>
  );
};
