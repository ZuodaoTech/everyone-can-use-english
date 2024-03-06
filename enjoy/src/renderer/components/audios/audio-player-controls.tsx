import { createContext, useEffect, useState, useContext, useRef } from "react";
import { type Region as RegionType } from "wavesurfer.js/dist/plugins/regions";
import {
  extractFrequencies,
  PitchContour,
  MediaPlayerControls,
  MediaCaption,
} from "@renderer/components";
import { Button, toast } from "@renderer/components/ui";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import {
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
} from "lucide-react";
import { t } from "i18next";
import { secondsToTimestamp } from "@renderer/lib/utils";

export const AudioPlayerControls = () => {
  const {
    media,
    decoded,
    wavesurfer,
    currentSegmentIndex,
    setCurrentSegmentIndex,
    transcription,
    waveform,
    regions,
  } = useContext(MediaPlayerProviderContext);
  const [playMode, setPlayMode] = useState<"loop" | "single" | "all">("all");
  const [playBackRate, setPlaybackRate] = useState<number>(1);
  const [displayInlineCaption, setDisplayInlineCaption] =
    useState<boolean>(true);

  const onPrev = () => {
    if (!wavesurfer) return;
    const segment = transcription?.result[currentSegmentIndex - 1];
    if (!segment) return;

    setCurrentSegmentIndex(currentSegmentIndex - 1);
    wavesurfer?.seekTo(segment.offsets.from / 1000.0 / media.duration);
  };
  const onNext = () => {
    if (!wavesurfer) return;
    const segment = transcription?.result[currentSegmentIndex + 1];
    if (!segment) return;

    setCurrentSegmentIndex(currentSegmentIndex + 1);
    wavesurfer?.seekTo(segment.offsets.from / 1000.0 / media.duration);
  };

  const addSegmentRegion = (options: {
    id: string;
    from: number;
    to: number;
  }) => {
    if (!wavesurfer) return;

    const { id, from, to } = options;
    const span = document.createElement("span");
    span.innerText = secondsToTimestamp(from) + ` (${(to - from).toFixed(2)}s)`;
    span.style.padding = "1rem";
    span.style.fontSize = "0.9rem";

    if (regions) {
      regions.clearRegions();
      const region = regions.addRegion({
        id,
        start: from,
        end: to,
        color: "rgba(255, 0, 0, 0.03)",
        drag: false,
        resize: false,
        content: span,
      });
      renderPitchContour(region);
    }
  };

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

    const containerId = `pitch-contour-${media.id}-${currentSegmentIndex}`;
    const wrapper = (wavesurfer as any).renderer.getWrapper();

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const canvas = PitchContour({
      frequencies: waveform.frequencies.slice(fromIndex, toIndex),
      height,
    });
    const offsetLeft = (region.start / duration) * wrapperWidth;
    const width = ((region.end - region.start) / duration) * wrapperWidth;
    const pitchContourWidthContainer = document.createElement("div");
    pitchContourWidthContainer.appendChild(canvas);

    pitchContourWidthContainer.style.position = "absolute";
    pitchContourWidthContainer.style.top = "0";
    pitchContourWidthContainer.style.left = "0";

    canvas.style.width = `${width}px`;
    pitchContourWidthContainer.style.height = `${height}px`;
    pitchContourWidthContainer.style.marginLeft = `${offsetLeft}px`;
    pitchContourWidthContainer.className = "pitch-contour";
    pitchContourWidthContainer.id = containerId;

    const regionDuration = region.end - region.start;

    if (displayInlineCaption) {
      const captionContainer = document.createElement("div");
      captionContainer.style.position = "absolute";
      captionContainer.style.bottom = "0";
      captionContainer.style.width = `${width}px`;
      captionContainer.style.fontSize = "0.75rem";
      captionContainer.style.opacity = "0.75";
      transcription?.result?.[currentSegmentIndex]?.segments?.forEach(
        (segment, index) => {
          const span = document.createElement("span");
          span.innerText = segment.text;
          span.style.position = "absolute";
          span.style.bottom = "0";
          span.style.left = `${
            ((segment.offsets.from / 1000 - region.start) / regionDuration) *
            width
          }px`;
          if (index % 2 === 1) {
            span.style.paddingBottom = "0.75rem";
          }

          captionContainer.appendChild(span);
        }
      );
      pitchContourWidthContainer.appendChild(captionContainer);
    }

    wrapper.querySelector("#" + containerId)?.remove();
    wrapper.appendChild(pitchContourWidthContainer);
  };

  useEffect(() => {
    if (!regions) return;

    const currentSegment = transcription?.result?.[currentSegmentIndex];
    if (!currentSegment) return;

    addSegmentRegion({
      id: `segment-${currentSegmentIndex}`,
      from: currentSegment.offsets.from / 1000.0,
      to: currentSegment.offsets.to / 1000.0,
    });
  }, [currentSegmentIndex, regions]);

  /*
   * When regions are available,
   * set up event listeners for regions
   * and clean up when component is unmounted
   */
  useEffect(() => {
    if (!regions) return;

    const subscriptions = [
      wavesurfer.on("finish", () => {
        if (playMode !== "loop") return;

        regions?.getRegions()[0]?.play();
      }),

      regions.on("region-updated", (region) => {
      }),

      regions.on("region-created", (region: RegionType) => {
        region.on("click", () => {
          wavesurfer.play();
        });
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [playMode, regions]);

  useEffect(() => {
    if (!transcription?.result) return;
    if (!decoded) return;
    if (!wavesurfer) return;

    setCurrentSegmentIndex(0);
    const segment = transcription.result[0];
    wavesurfer.seekTo(segment.offsets.from / 1000.0 / wavesurfer.getDuration());
  }, [decoded, transcription]);

  return (
    <div className="w-full h-20 border-t flex items-center justify-center space-x-1">
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

      {wavesurfer?.isPlaying() ? (
        <Button
          variant="secondary"
          onClick={() => wavesurfer?.pause()}
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("pause")}
          className="aspect-square p-0 h-14 rounded-full"
        >
          <PauseIcon className="w-6 h-6" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="lg"
          onClick={() => wavesurfer?.play()}
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("play")}
          className="aspect-square p-0 h-14 rounded-full"
        >
          <PlayIcon className="w-6 h-6" />
        </Button>
      )}

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
    </div>
  );
};
