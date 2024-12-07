import { useEffect, useState, useContext, useRef } from "react";
import { type Region as RegionType } from "wavesurfer.js/dist/plugins/regions";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@renderer/components/ui";
import {
  MediaShadowProviderContext,
  AppSettingsProviderContext,
  HotKeysSettingsProviderContext,
} from "@renderer/context";
import {
  ScissorsIcon,
  PlayIcon,
  PauseIcon,
  Repeat1Icon,
  RepeatIcon,
  GaugeIcon,
  ListRestartIcon,
  SkipForwardIcon,
  SkipBackIcon,
  SaveIcon,
  UndoIcon,
  GroupIcon,
} from "lucide-react";
import { t } from "i18next";
import { useHotkeys } from "react-hotkeys-hook";
import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";
import { AlignmentResult } from "echogarden/dist/api/API.d.js";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";

const PLAYBACK_RATE_OPTIONS = [0.75, 0.8, 0.9, 1.0];
export const MediaPlayerControls = () => {
  const {
    decoded,
    wavesurfer,
    currentTime,
    currentSegmentIndex,
    setCurrentSegmentIndex,
    zoomRatio,
    setZoomRatio,
    fitZoomRatio,
    transcription,
    regions,
    activeRegion,
    setActiveRegion,
    editingRegion,
    setEditingRegion,
    transcriptionDraft,
    setTranscriptionDraft,
  } = useContext(MediaShadowProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentHotkeys } = useContext(HotKeysSettingsProviderContext);
  const [playMode, setPlayMode] = useState<"loop" | "single" | "all">("single");
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [grouping, setGrouping] = useState(false);
  const isLoopPausing = useRef(false);

  const playOrPause = () => {
    if (!wavesurfer) return;

    wavesurfer.playPause();
  };
  const debouncedPlayOrPause = debounce(playOrPause, 100);

  const onPrev = () => {
    if (!wavesurfer) return;
    const segment = transcription?.result?.timeline[currentSegmentIndex - 1];
    if (!segment) return;

    setCurrentSegmentIndex(currentSegmentIndex - 1);
  };

  const onNext = () => {
    if (!wavesurfer) return;
    const segment = transcription?.result?.timeline[currentSegmentIndex + 1];
    if (!segment) return;

    setCurrentSegmentIndex(currentSegmentIndex + 1);
  };

  /*
   * Update segmentRegion when currentSegmentIndex is updated
   * or when editingRegion is toggled.
   * It will clear all regions and add a new region for the current segment.
   */
  const updateSegmentRegion = () => {
    if (!wavesurfer) return;
    if (!regions) return;

    // Do not update segmentRegion when editing word region
    if (
      editingRegion &&
      activeRegion &&
      activeRegion.id.startsWith("word-region")
    ) {
      return;
    }

    const currentSegment =
      transcription?.result?.timeline?.[currentSegmentIndex];
    if (!currentSegment) return;

    const id = `segment-region-${currentSegmentIndex}`;
    const from = currentSegment.startTime;
    const to = currentSegment.endTime;
    const span = document.createElement("span");
    span.innerText = `#${currentSegmentIndex + 1} (${(to - from).toFixed(2)}s)`;
    span.style.padding = "1rem";
    span.style.fontSize = "0.9rem";

    regions
      .getRegions()
      .filter((r) => r.id.startsWith("segment-region"))
      .forEach((r) => r.remove());

    const region = regions.addRegion({
      id,
      start: from,
      end: to,
      color: "#fb6f9211",
      drag: false,
      resize: editingRegion,
      content: span,
    });

    /*
     * Remain active wordRegion unchanged if it's still in the segment region.
     * It happens when word region finish editing and the transcription is updated.
     */
    if (
      activeRegion &&
      activeRegion.id.startsWith("word-region") &&
      activeRegion.start >= region.start &&
      activeRegion.end <= region.end
    ) {
      return;
    }

    /*
     * Otherwise remove all word regions.
     * Set the segment region as active
     */
    regions
      .getRegions()
      .filter((r) => r.id.startsWith("word-region"))
      .forEach((r) => r.remove());
    setActiveRegion(region);
    wavesurfer.setScrollTime(region.start);
  };

  // Debounce updateSegmentRegion
  const debouncedUpdateSegmentRegion = debounce(updateSegmentRegion, 100);

  const groupMeanings = () => {
    if (!regions) return;

    regions
      .getRegions()
      .filter((r) => r.id.startsWith("meaning-group-region"))
      .forEach((r) => r.remove());

    const groups: { start: number; end: number }[] = [];
    const segment = transcription?.result?.timeline[currentSegmentIndex];
    if (!segment) return;

    const words = segment.text.split(" ");
    const silenceThreshold = 0.15;
    const groupThreshold = 0.5;

    let start = segment.timeline[0].startTime;
    let end = segment.timeline[0].endTime;

    segment.timeline.forEach((word: TimelineEntry, i: number) => {
      const text = words[i - 1];
      const lastWord = segment.timeline[i - 1];

      if (
        // split group when silence is longer than silenceThreshold
        (word.startTime - end > silenceThreshold ||
          // split group when there is a comma or colon at the end of the word
          (text &&
            lastWord &&
            text.match(/,|:$/) &&
            text.includes(lastWord.text))) &&
        // split group only when group duration is longer than groupThreshold
        end - start > groupThreshold
      ) {
        groups.push({ start, end });
        start = word.startTime;
        end = word.endTime;
      } else {
        end = word.endTime;
      }
    });
    groups.push({ start, end });

    const groupRegions: RegionType[] = [];
    groups.forEach((group) => {
      groupRegions.push(
        regions.addRegion({
          id: `meaning-group-region-${Date.now()}`,
          start: group.start,
          end: group.end,
          color: "#fb6f9233",
          drag: false,
          resize: false,
        })
      );
    });

    setActiveRegion(groupRegions[0]);
  };

  const findAndClickElement = (id: string) => {
    const button = document.getElementById(id);
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const elementAtPoint = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    if (elementAtPoint !== button && !button.contains(elementAtPoint)) return;

    button.click();
  };

  /*
   * Update segmentRegion when currentSegmentIndex is updated
   */
  useEffect(() => {
    if (!regions) return;

    // Exit editing when segment is updated
    setEditingRegion(false);
    debouncedUpdateSegmentRegion();
  }, [currentSegmentIndex, regions, transcription?.result]);

  /*
   * Update region to editable when editingRegion is toggled
   */
  useEffect(() => {
    debouncedUpdateSegmentRegion();
  }, [editingRegion]);

  /*
   * When regions are available,
   * set up event listeners for regions
   * and clean up when component is unmounted
   */
  useEffect(() => {
    if (!regions) return;
    if (!transcription?.result) return;

    const segmentRegion = regions
      .getRegions()
      .find((r) => r.id === `segment-region-${currentSegmentIndex}`);

    const subscriptions = [
      regions.on("region-updated", (region) => {
        if (region !== segmentRegion) {
          return;
        }

        const draft = cloneDeep(transcription.result);

        draft.timeline[currentSegmentIndex].startTime = region.start;
        draft.timeline[currentSegmentIndex].endTime = region.end;

        // ensure that the previous segment ends before the current segment
        if (
          currentSegmentIndex > 0 &&
          draft.timeline[currentSegmentIndex - 1].endTime > region.start
        ) {
          draft.timeline[currentSegmentIndex - 1].endTime = region.start;
        }

        // ensure that the next segment starts after the current segment
        if (
          currentSegmentIndex < draft.length - 1 &&
          draft.timeline[currentSegmentIndex + 1].startTime < region.end
        ) {
          draft.timeline[currentSegmentIndex + 1].startTime = region.end;
        }

        setTranscriptionDraft(draft);
      }),

      regions.on("region-clicked", (region, event) => {
        if (region.id.startsWith("meaning-group-region")) {
          setActiveRegion(region);
          region.play();
          event.stopPropagation();
        }
      }),

      regions.on("region-out", (region) => {
        if (region.id !== activeRegion?.id) return;
        if (playMode === "all" || isLoopPausing.current) return;

        // Pause immediately
        wavesurfer.pause();

        // Use requestAnimationFrame to prevent recursion
        requestAnimationFrame(() => {
          if (playMode === "loop") {
            // Set time and play with proper guards
            if (!isLoopPausing.current) {
              isLoopPausing.current = true;
              wavesurfer.setTime(parseFloat(region.start.toFixed(6)));

              setTimeout(() => {
                isLoopPausing.current = false;
                if (playMode === "loop") {
                  wavesurfer.play();
                }
              }, 500);
            }
          } else if (playMode === "single") {
            wavesurfer.setTime(parseFloat(region.start.toFixed(6)));
            wavesurfer.setScrollTime(parseFloat(region.start.toFixed(6)));
          }
        });
      }),
    ];

    // More robust position check interval
    const checkIntervalId = setInterval(() => {
      if (
        !activeRegion ||
        playMode === "all" ||
        !wavesurfer.isPlaying() ||
        isLoopPausing.current
      )
        return;

      const currentTime = wavesurfer.getCurrentTime();
      const EPSILON = 0.01;

      const isOutsideRegion =
        currentTime < activeRegion.start - EPSILON ||
        currentTime > activeRegion.end + EPSILON;

      if (isOutsideRegion && currentTime !== 0) {
        if (playMode === "loop") {
          // Force reset to start and ensure playback continues
          wavesurfer.pause();
          isLoopPausing.current = true;
          wavesurfer.setTime(parseFloat(activeRegion.start.toFixed(6)));
          setTimeout(() => {
            isLoopPausing.current = false;
            if (playMode === "loop") {
              wavesurfer.play();
            }
          }, 500);
        }
      }
    }, 50); // Even more frequent checks for better reliability

    return () => {
      subscriptions.forEach((unsub) => unsub());
      clearInterval(checkIntervalId);
    };
  }, [playMode, regions, transcription, currentSegmentIndex, activeRegion]);

  /*
   * Auto select the firt segment when everything is ready
   */
  useEffect(() => {
    if (!transcription?.result) return;
    if (!transcription.result["transcript"]) return;
    if (!decoded) return;
    if (!wavesurfer) return;

    const segment = transcription.result.timeline[currentSegmentIndex];
    if (!segment) {
      setCurrentSegmentIndex(0);
      return;
    }
    wavesurfer.setScrollTime(segment.startTime);
    wavesurfer.setTime(parseFloat(segment.startTime.toFixed(6)));
  }, [decoded, transcription?.id, wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) return;

    wavesurfer.setPlaybackRate(playbackRate);
  }, [playbackRate, wavesurfer]);

  /*
   * Update currentSegmentIndex when currentTime is updated
   */
  useEffect(() => {
    if (!transcription?.result) return;
    if (!transcription.result["transcript"]) return;

    const index = (transcription.result as AlignmentResult).timeline.findIndex(
      (t) => currentTime >= t.startTime && currentTime < t.endTime
    );
    if (index === -1) return;
    // Stay on the current segment if playMode is single
    if (["single", "loop"].includes(playMode) && index !== currentSegmentIndex)
      return;

    setCurrentSegmentIndex(index);
  }, [currentTime, transcription?.result]);

  useHotkeys(
    currentHotkeys.PlayOrPause,
    () => {
      findAndClickElement("media-play-or-pause-button");
    },
    {
      preventDefault: true,
    }
  );
  useHotkeys(
    currentHotkeys.PlayPreviousSegment,
    () => {
      findAndClickElement("media-play-previous-button");
    },
    {
      preventDefault: true,
    }
  );
  useHotkeys(
    currentHotkeys.PlayNextSegment,
    () => {
      findAndClickElement("media-play-next-button");
    },
    {
      preventDefault: true,
    }
  );
  useHotkeys(
    currentHotkeys.StartOrStopRecording,
    () => {
      findAndClickElement("media-record-button");
    },
    {
      preventDefault: true,
    }
  );
  useHotkeys(
    currentHotkeys.IncreasePlaybackRate,
    () => {
      setPlaybackRate(
        PLAYBACK_RATE_OPTIONS[
          PLAYBACK_RATE_OPTIONS.indexOf(playbackRate) + 1
        ] ?? playbackRate
      );
    },
    {
      preventDefault: true,
    }
  );
  useHotkeys(
    currentHotkeys.DecreasePlaybackRate,
    () => {
      setPlaybackRate(
        PLAYBACK_RATE_OPTIONS[
          PLAYBACK_RATE_OPTIONS.indexOf(playbackRate) - 1
        ] ?? playbackRate
      );
    },
    {
      preventDefault: true,
    }
  );

  /*
   * Fit zoom ratio when activeRegion is word or segment
   * not in playMode all
   */
  useEffect(() => {
    if (!activeRegion) return;
    if (zoomRatio === fitZoomRatio) return;
    if (playMode === "all") return;

    if (
      activeRegion.id.startsWith("word-region") ||
      activeRegion.id.startsWith("segment-region")
    ) {
      if (!wavesurfer.isPlaying()) {
        wavesurfer.setTime(parseFloat(activeRegion.start.toFixed(6)));
      }
      setZoomRatio(fitZoomRatio);
    }
  }, [activeRegion, fitZoomRatio]);

  /*
   * Remove word regions when meaning group region is active
   * and vice versa
   */
  useEffect(() => {
    if (!regions) return;
    if (!activeRegion) return;

    if (activeRegion.id.startsWith("meaning-group-region")) {
      regions
        .getRegions()
        .filter((r) => r.id.startsWith("word-region"))
        .forEach((r) => r.remove());
    } else {
      setGrouping(false);
    }
  }, [regions, activeRegion]);

  /*
   * toggle meaning groups
   */
  useEffect(() => {
    if (!regions) return;

    if (grouping) {
      groupMeanings();
    }

    return () => {
      const currentRegions = regions.getRegions();
      currentRegions
        .filter((r) => r.id.startsWith("meaning-group-region"))
        .forEach((r) => r.remove());

      const wordRegion = currentRegions.find((r) =>
        r.id.startsWith("word-region")
      );
      const segmentRegion = currentRegions.find((r) =>
        r.id.startsWith("segment-region")
      );
      setActiveRegion(wordRegion || segmentRegion);
    };
  }, [grouping]);

  return (
    <div className="w-full h-14 flex items-center justify-center px-6">
      <div className="flex items-center justify-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={`${playbackRate == 1.0 ? "ghost" : "secondary"}`}
              data-tooltip-id="media-shadow-tooltip"
              data-tooltip-content={t("playbackSpeed")}
              className="relative aspect-square p-0 h-8"
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
            <div
              id="media-playback-rate-controller"
              className="mb-4 text-center"
            >
              {t("playbackRate")}
            </div>
            <div className="w-full rounded-full flex items-center justify-between bg-muted">
              {PLAYBACK_RATE_OPTIONS.map((rate, i) => (
                <div
                  key={i}
                  className={`cursor-pointer h-8 w-8 leading-8 rounded-full flex items-center justify-center ${
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              data-tooltip-id="media-shadow-tooltip"
              data-tooltip-content={t("switchPlayMode")}
              className="aspect-square p-0 h-8"
            >
              {playMode === "single" && <RepeatIcon className="w-6 h-6" />}
              {playMode === "loop" && <Repeat1Icon className="w-6 h-6" />}
              {playMode === "all" && <ListRestartIcon className="w-6 h-6" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className={playMode === "single" ? "bg-muted" : ""}
              onClick={() => setPlayMode("single")}
            >
              <RepeatIcon className="w-4 h-4 mr-2" />
              <span>{t("playSingleSegment")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className={playMode === "loop" ? "bg-muted" : ""}
              onClick={() => setPlayMode("loop")}
            >
              <Repeat1Icon className="w-4 h-4 mr-2" />
              <span>{t("playInLoop")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className={playMode === "all" ? "bg-muted" : ""}
              onClick={() => setPlayMode("all")}
            >
              <ListRestartIcon className="w-4 h-4 mr-2" />
              <span>{t("playAllSegments")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="lg"
          onClick={onPrev}
          id="media-play-previous-button"
          data-tooltip-id="media-shadow-tooltip"
          data-tooltip-content={t("playPreviousSegment")}
          className="aspect-square p-0 h-8"
        >
          <SkipBackIcon className="w-6 h-6" />
        </Button>

        {wavesurfer?.isPlaying() ? (
          <Button
            variant="default"
            onClick={debouncedPlayOrPause}
            id="media-play-or-pause-button"
            data-tooltip-id="media-shadow-tooltip"
            data-tooltip-content={t("pause")}
            className="aspect-square p-0 h-10 rounded-full"
          >
            <PauseIcon fill="white" className="w-6 h-6" />
          </Button>
        ) : (
          <Button
            variant="default"
            onClick={debouncedPlayOrPause}
            id="media-play-or-pause-button"
            data-tooltip-id="media-shadow-tooltip"
            data-tooltip-content={t("play")}
            className="aspect-square p-0 h-10 rounded-full"
          >
            <PlayIcon fill="white" className="w-6 h-6" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="lg"
          onClick={onNext}
          id="media-play-next-button"
          data-tooltip-id="media-shadow-tooltip"
          data-tooltip-content={t("playNextSegment")}
          className="aspect-square p-0 h-8"
        >
          <SkipForwardIcon className="w-6 h-6" />
        </Button>

        <Button
          variant={grouping ? "secondary" : "ghost"}
          size="icon"
          data-tooltip-id="media-shadow-tooltip"
          data-tooltip-content={t("autoGroup")}
          className="relative aspect-square p-0 h-8"
          onClick={() => setGrouping(!grouping)}
        >
          <GroupIcon className="w-6 h-6" />
        </Button>

        <div className="relative">
          <Button
            variant={`${editingRegion ? "secondary" : "ghost"}`}
            data-tooltip-id="media-shadow-tooltip"
            data-tooltip-content={
              editingRegion ? t("dragRegionBorderToEdit") : t("editRegion")
            }
            className="relative aspect-square p-0 h-8"
            onClick={() => {
              setEditingRegion(!editingRegion);
            }}
          >
            <ScissorsIcon className="w-6 h-6" />
          </Button>

          {editingRegion && (
            <div className="absolute top-0 left-12 flex items-center space-x-2">
              <Button
                variant="secondary"
                className="relative aspect-square p-0 h-8"
                data-tooltip-id="media-shadow-tooltip"
                data-tooltip-content={t("cancel")}
                onClick={() => {
                  setEditingRegion(false);
                  setTranscriptionDraft(null);
                }}
              >
                <UndoIcon className="w-6 h-6" />
              </Button>
              <Button
                variant="default"
                className="relative aspect-square p-0 h-8"
                data-tooltip-id="media-shadow-tooltip"
                data-tooltip-content={t("save")}
                onClick={() => {
                  if (!transcriptionDraft) return;

                  EnjoyApp.transcriptions
                    .update(transcription.id, {
                      result: transcriptionDraft,
                    })
                    .then(() => {
                      setTranscriptionDraft(null);
                      setEditingRegion(false);
                    });
                }}
              >
                <SaveIcon className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
