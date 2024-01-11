import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@renderer/components/ui";
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
} from "lucide-react";
import { t } from "i18next";
import { type WaveSurferOptions } from "wavesurfer.js";
import { Tooltip } from "react-tooltip";

const PLAYBACK_RATE_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75];
const MIN_ZOOM_RATIO = 0.25;
const MAX_ZOOM_RATIO = 5.0;

export const MediaPlayerControls = (props: {
  isPlaying: boolean;
  isLooping: boolean;
  onPlayOrPause: () => void;
  onPause?: () => void;
  onLoop?: () => void;
  onRecord?: () => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  fitZoomRatio?: number;
  zoomRatio?: number;
  setZoomRatio?: (ratio: number) => void;
  recordButtonVisible?: boolean;
  setRecordButtonVisible?: (hidden: boolean) => void;
  transcriptionDirty?: boolean;
  resetTranscription?: () => void;
  saveTranscription?: () => void;
  wavesurferOptions?: any;
  setWavesurferOptions?: (options: Partial<WaveSurferOptions>) => void;
  displayInlineCaption?: boolean;
  setDisplayInlineCaption?: (display: boolean) => void;
  onShare?: () => void;
}) => {
  const {
    isPlaying,
    isLooping,
    onPlayOrPause,
    onLoop,
    playbackRate,
    setPlaybackRate,
    fitZoomRatio,
    zoomRatio,
    setZoomRatio,
    recordButtonVisible,
    setRecordButtonVisible,
    transcriptionDirty,
    resetTranscription,
    saveTranscription,
    wavesurferOptions,
    setWavesurferOptions,
    displayInlineCaption,
    setDisplayInlineCaption,
    onShare,
  } = props;

  return (
    <div className="w-full flex items-center justify-center space-x-1 relative">
      {isPlaying ? (
        <Button
          onClick={onPlayOrPause}
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("pause")}
          className="aspect-square p-0 h-10"
        >
          <PauseIcon className="w-6 h-6" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          onClick={onPlayOrPause}
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("play")}
          className="aspect-square p-0 h-10"
        >
          <PlayIcon className="w-6 h-6" />
        </Button>
      )}
      {isLooping ? (
        <Button
          onClick={onLoop}
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("stopLoop")}
          className="aspect-square p-0 h-10"
        >
          <Repeat1Icon className="w-6 h-6" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          onClick={onLoop}
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("loop")}
          className="aspect-square p-0 h-10"
        >
          <RepeatIcon className="w-6 h-6" />
        </Button>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={`${playbackRate == 1.0 ? "ghost" : "default"}`}
            data-tooltip-id="media-player-controls-tooltip"
            data-tooltip-content={t("playbackSpeed")}
            className="relative aspect-square p-0 h-10"
          >
            <GaugeIcon className="w-6 h-6" />
            {playbackRate != 1.0 && (
              <span className="absolute left-[0.9rem] bottom-0 text-[0.70rem] text-white">
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
                {[0.5, 1.0, 1.5].includes(rate) || rate === playbackRate ? (
                  <span className="">{rate}</span>
                ) : (
                  <div className="h-2 w-[1px] bg-black/50"></div>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant={`${zoomRatio > 1.0 ? "default" : "ghost"}`}
        data-tooltip-id="media-player-controls-tooltip"
        data-tooltip-content={t("zoomIn")}
        className="relative aspect-square p-0 h-10"
        onClick={() => {
          if (zoomRatio < MAX_ZOOM_RATIO) {
            const nextZoomRatio = PLAYBACK_RATE_OPTIONS.find(
              (rate) => rate > zoomRatio
            );
            setZoomRatio(nextZoomRatio || MAX_ZOOM_RATIO);
          }
        }}
      >
        <ZoomInIcon className="w-6 h-6" />
      </Button>

      <Button
        variant={`${zoomRatio < 1.0 ? "default" : "ghost"}`}
        data-tooltip-id="media-player-controls-tooltip"
        data-tooltip-content={t("zoomOut")}
        className="relative aspect-square p-0 h-10"
        onClick={() => {
          if (zoomRatio > MIN_ZOOM_RATIO) {
            const nextZoomRatio = PLAYBACK_RATE_OPTIONS.reverse().find(
              (rate) => rate < zoomRatio
            );
            setZoomRatio(nextZoomRatio || MIN_ZOOM_RATIO);
          }
        }}
      >
        <ZoomOutIcon className="w-6 h-6" />
      </Button>

      <Button
        variant={`${zoomRatio === fitZoomRatio ? "default" : "ghost"}`}
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

      <Button
        variant={`${wavesurferOptions?.autoCenter ? "default" : "ghost"}`}
        data-tooltip-id="media-player-controls-tooltip"
        data-tooltip-content={t("autoCenter")}
        className="relative aspect-square p-0 h-10"
        onClick={() => {
          setWavesurferOptions({
            autoCenter: !wavesurferOptions?.autoCenter,
          });
        }}
      >
        <GalleryHorizontalIcon className="w-6 h-6" />
      </Button>

      <Button
        variant={`${displayInlineCaption ? "default" : "ghost"}`}
        data-tooltip-id="media-player-controls-tooltip"
        data-tooltip-content={t("inlineCaption")}
        className="relative aspect-square p-0 h-10"
        onClick={() => {
          setDisplayInlineCaption(!displayInlineCaption);
        }}
      >
        <SpellCheckIcon className="w-6 h-6" />
      </Button>

      {setRecordButtonVisible && (
        <Button
          variant={`${recordButtonVisible ? "default" : "ghost"}`}
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("record")}
          className="relative aspect-square p-0 h-10"
          onClick={() => {
            setRecordButtonVisible(!recordButtonVisible);
          }}
        >
          <MicIcon className="w-6 h-6" />
        </Button>
      )}

      <Button
        variant="ghost"
        data-tooltip-id="media-player-controls-tooltip"
        data-tooltip-content={t("share")}
        className="relative aspect-square p-0 h-10"
        onClick={onShare}
      >
        <Share2Icon className="w-6 h-6" />
      </Button>

      <div className="absolute right-4">
        <div className="flex items-center space-x-4">
          {transcriptionDirty && (
            <>
              <Button
                variant="secondary"
                className=""
                onClick={resetTranscription}
              >
                {t("reset")}
              </Button>
              <Button onClick={saveTranscription}>{t("save")}</Button>
            </>
          )}
        </div>
      </div>

      <Tooltip id="media-player-controls-tooltip" />
    </div>
  );
};
