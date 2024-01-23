import { useEffect, useState, useCallback, useRef, useContext } from "react";
import {
  extractFrequencies,
  PitchContour,
  MediaPlayerControls,
  MediaCaption,
} from "@renderer/components";
import Regions, {
  Region,
  type Region as RegionType,
} from "wavesurfer.js/dist/plugins/regions";
import { secondsToTimestamp } from "@renderer/lib/utils";
import WaveSurfer from "wavesurfer.js";
import { useDebounce } from "@uidotdev/usehooks";
import { AppSettingsProviderContext } from "@renderer/context";
import { cloneDeep } from "lodash";
import {
  MediaPlayer as VidstackMediaPlayer,
  MediaProvider,
  isAudioProvider,
  isVideoProvider,
  useMediaRemote,
} from "@vidstack/react";
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { useHotkeys } from "react-hotkeys-hook";

const minPxPerSecBase = 150;

export const MediaPlayer = (props: {
  mediaId: string;
  mediaType: "Audio" | "Video";
  mediaUrl: string;
  mediaMd5?: string;
  transcription: TranscriptionType;
  // player controls
  currentTime: number;
  setCurrentTime: (time: number) => void;
  currentSegmentIndex: number;
  setCurrentSegmentIndex: (index: number) => void;
  initialized: boolean;
  setInitialized: (value: boolean) => void;
  recordButtonVisible?: boolean;
  setRecordButtonVisible?: (value: boolean) => void;
  seek?: {
    seekTo: number;
    timestamp: number;
  };
  height?: number;
  zoomRatio: number;
  setZoomRatio: (value: number) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  isLooping: boolean;
  setIsLooping: (value: boolean) => void;
  playBackRate: number;
  setPlaybackRate: (value: number) => void;
  displayInlineCaption?: boolean;
  setDisplayInlineCaption?: (value: boolean) => void;
  onShare?: () => void;
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const {
    mediaId,
    mediaType,
    mediaUrl,
    mediaMd5,
    transcription,
    height = 200,
    currentTime,
    setCurrentTime,
    currentSegmentIndex,
    setCurrentSegmentIndex,
    initialized,
    setInitialized,
    recordButtonVisible,
    setRecordButtonVisible,
    seek,
    zoomRatio,
    setZoomRatio,
    isPlaying,
    setIsPlaying,
    isLooping,
    setIsLooping,
    playBackRate,
    setPlaybackRate,
    displayInlineCaption,
    setDisplayInlineCaption,
    onShare,
  } = props;
  if (!mediaUrl) return;

  const [wavesurfer, setWavesurfer] = useState(null);
  const [waveform, setWaveForm] = useState<WaveFormDataType>(null);
  const containerRef = useRef<HTMLDivElement>();
  const [mediaProvider, setMediaProvider] = useState<
    HTMLAudioElement | HTMLVideoElement
  >(null);
  const mediaRemote = useMediaRemote();

  const [transcriptionResult, setTranscriptionResult] = useState<
    TranscriptionResultSegmentGroupType[] | null
  >(null);

  const [transcriptionDirty, setTranscriptionDirty] = useState<boolean>(false);
  const [regions, setRegions] = useState<Regions | null>(null);

  const debouncedTRanscription = useDebounce(transcriptionResult, 500);

  const resetTranscription = () => {
    if (!transcriptionDirty) return;
    if (!transcription?.result) return;

    setTranscriptionResult(cloneDeep(transcription.result));
    setTranscriptionDirty(false);
  };

  const saveTranscription = () => {
    if (!transcriptionDirty) return;
    if (!debouncedTRanscription) return;

    EnjoyApp.transcriptions.update(transcription.id, {
      result: debouncedTRanscription,
    });
  };

  const onPlayClick = useCallback(() => {
    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  }, [wavesurfer]);

  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      wavesurfer.setPlaybackRate(rate);
      setPlaybackRate(wavesurfer.getPlaybackRate());
    },
    [initialized]
  );

  const findCurrentSegment = (time: number) => {
    if (!transcription) return;
    if (isPlaying && isLooping) return;

    time = Math.round(time * 1000);
    const index = transcriptionResult.findIndex(
      (t) => time >= t.offsets.from && time < t.offsets.to
    );

    setCurrentSegmentIndex(index);
  };

  const addSegmentRegion = (from: number, to: number) => {
    if (!initialized) return;

    const span = document.createElement("span");
    span.innerText = secondsToTimestamp(from) + ` (${(to - from).toFixed(2)}s)`;
    span.style.padding = "1rem";
    span.style.fontSize = "0.9rem";

    if (regions) {
      regions.clearRegions();
      const region = regions.addRegion({
        start: from,
        end: to,
        color: "rgba(255, 0, 0, 0.03)",
        drag: false,
        resize: true,
        content: span,
      });
      renderPitchContour(region);
    }
  };

  const renderPitchContour = (region: RegionType) => {
    if (!region) return;
    if (!waveform?.frequencies?.length) return;
    if (!wavesurfer) return;

    const duration = wavesurfer.getDuration();
    const fromIndex = Math.round(
      (region.start / duration) * waveform.frequencies.length
    );
    const toIndex = Math.round(
      (region.end / duration) * waveform.frequencies.length
    );

    const containerId = `pitch-contour-${mediaId}-${currentSegmentIndex}`;
    const wrapper = wavesurfer.renderer.getWrapper();

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
      transcriptionResult?.[currentSegmentIndex]?.segments?.forEach(
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

  const reRenderPitchContour = () => {
    if (!wavesurfer) return;
    const wrapper = wavesurfer.renderer.getWrapper();
    wrapper
      .querySelectorAll(".pitch-contour")
      .forEach((canvas: HTMLCanvasElement) => {
        canvas.remove();
      });

    if (!regions) return;

    const region = regions.getRegions()[0];
    if (!region) return;

    renderPitchContour(region);
  };

  useEffect(() => {
    if (!transcription) return;
    setTranscriptionDirty(false);

    setTranscriptionResult(cloneDeep(transcription.result));
  }, [transcription]);

  // Initialize wavesurfer
  const initializeWavesurfer = async () => {
    if (!mediaProvider) return;
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: "#ddd",
      progressColor: "rgba(0, 0, 0, 0.25)",
      cursorColor: "#dc143c",
      barWidth: 1,
      autoScroll: true,
      minPxPerSec: 150,
      autoCenter: false,
      dragToSeek: false,
      media: mediaProvider,
      peaks: waveform ? [waveform.peaks] : undefined,
      duration: waveform ? waveform.duration : undefined,
    });

    const blob = await fetch(mediaUrl).then((res) => res.blob());

    if (waveform) {
      ws.loadBlob(blob, [waveform.peaks], waveform.duration);
      setInitialized(true);
    } else {
      ws.loadBlob(blob);
    }

    setRegions(ws.registerPlugin(Regions.create()));
    setWavesurfer(ws);
  };

  useEffect(() => {
    initializeWavesurfer();

    return () => {
      wavesurfer?.destroy();
    };
  }, [mediaUrl, height, mediaProvider]);

  // Install listeners for wavesurfer
  useEffect(() => {
    if (!wavesurfer) return;
    setCurrentTime(0);
    setIsPlaying(false);

    const subscriptions = [
      wavesurfer.on("play", () => setIsPlaying(true)),
      wavesurfer.on("pause", () => setIsPlaying(false)),
      wavesurfer.on("loading", (percent: number) => console.log(percent)),
      wavesurfer.on("timeupdate", (time: number) => setCurrentTime(time)),
      wavesurfer.on("decode", () => {
        if (waveform?.frequencies) return;

        const peaks: Float32Array = wavesurfer
          .getDecodedData()
          .getChannelData(0);
        const duration: number = wavesurfer.getDuration();
        const sampleRate = wavesurfer.options.sampleRate;
        const _frequencies = extractFrequencies({ peaks, sampleRate });
        const _waveform = {
          peaks: Array.from(peaks),
          duration,
          sampleRate,
          frequencies: _frequencies,
        };
        EnjoyApp.waveforms.save(mediaMd5, _waveform);
        setWaveForm(_waveform);
      }),
      wavesurfer.on("ready", () => {
        setInitialized(true);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer]);

  useEffect(() => {
    if (!transcriptionResult) return;
    if (transcriptionDirty) return;

    const currentSegment = transcriptionResult[currentSegmentIndex];
    if (!currentSegment) return;

    addSegmentRegion(
      currentSegment.offsets.from / 1000.0,
      currentSegment.offsets.to / 1000.0
    );
  }, [
    currentSegmentIndex,
    initialized,
    transcriptionDirty,
    transcriptionResult,
  ]);

  useEffect(() => {
    if (!transcriptionResult) return;

    findCurrentSegment(currentTime);
  }, [currentTime, transcriptionResult]);

  useEffect(() => {
    if (!regions) return;

    const subscriptions = [
      wavesurfer.on("finish", () => {
        if (!isLooping) return;

        regions?.getRegions()[0]?.play();
      }),

      regions.on("region-updated", (region) => {
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

        const _transcription = cloneDeep(transcriptionResult);
        _transcription[currentSegmentIndex].offsets = offsets;
        _transcription[currentSegmentIndex].timestamps = timestamps;

        // ensure that the previous segment ends before the current segment
        if (
          currentSegmentIndex > 0 &&
          _transcription[currentSegmentIndex - 1].offsets.to > offsets.from
        ) {
          _transcription[currentSegmentIndex - 1].offsets.to = offsets.from;
        }

        // ensure that the next segment starts after the current segment
        if (
          currentSegmentIndex < _transcription.length - 1 &&
          _transcription[currentSegmentIndex + 1].offsets.from < offsets.to
        ) {
          _transcription[currentSegmentIndex + 1].offsets.from = offsets.to;
        }

        setTranscriptionResult(_transcription);
        setTranscriptionDirty(true);

        renderPitchContour(region);
      }),
      regions.on("region-out", (region: Region) => {
        if (isPlaying && isLooping) {
          region.play();
        } else {
          resetTranscription();
        }
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [regions, isPlaying, isLooping, currentSegmentIndex, transcriptionDirty]);

  useEffect(() => {
    if (!wavesurfer) return;
    if (!initialized) return;

    wavesurfer.zoom(zoomRatio * minPxPerSecBase);
    reRenderPitchContour();
  }, [zoomRatio, wavesurfer, initialized, displayInlineCaption]);

  useEffect(() => {
    if (typeof seek?.seekTo !== "number") return;
    if (!wavesurfer) return;
    if (!initialized) return;

    wavesurfer.seekTo(seek?.seekTo / wavesurfer.getDuration());
  }, [seek, wavesurfer, initialized]);

  // Handle media provider
  useEffect(() => {
    if (!mediaRemote) return;
    if (!mediaProvider) return;

    if (mediaType !== "Video") return;
    if (recordButtonVisible) {
      mediaRemote.togglePictureInPicture();
    } else {
      mediaRemote.exitPictureInPicture();
    }
  }, [mediaRemote, mediaProvider, recordButtonVisible]);

  useEffect(() => {
    if (!wavesurfer) return;

    if (isPlaying) {
      wavesurfer.play();
    } else {
      wavesurfer.pause();
    }
  }, [wavesurfer, isPlaying]);

  useEffect(() => {
    EnjoyApp.waveforms.find(mediaMd5).then((waveform) => {
      setWaveForm(waveform);
    });
  }, []);

  const calcFitZoomRatio = () => {
    if (!containerRef.current) return;
    if (!wavesurfer) return;

    const currentSegment = transcriptionResult?.[currentSegmentIndex];
    if (!currentSegment) return;

    const containerWidth = containerRef.current.getBoundingClientRect().width;

    const duration =
      currentSegment.offsets.to / 1000.0 - currentSegment.offsets.from / 1000.0;
    const fitZoomRatio = (containerWidth / duration / minPxPerSecBase) * 0.95;

    return fitZoomRatio;
  };

  useHotkeys(
    "Space",
    (keyboardEvent, _hotkeyEvent) => {
      if (!wavesurfer) return;

      keyboardEvent.preventDefault();
      onPlayClick();
    },
    [wavesurfer]
  );

  return (
    <>
      <div className="mb-2" ref={containerRef} />
      <div className="mb-2 flex justify-center">
        <MediaPlayerControls
          isPlaying={isPlaying}
          onPlayOrPause={onPlayClick}
          isLooping={isLooping}
          onLoop={() => {
            setIsLooping(!isLooping);
          }}
          playbackRate={playBackRate}
          setPlaybackRate={handlePlaybackRateChange}
          zoomRatio={zoomRatio}
          setZoomRatio={setZoomRatio}
          fitZoomRatio={calcFitZoomRatio()}
          recordButtonVisible={recordButtonVisible}
          setRecordButtonVisible={setRecordButtonVisible}
          transcriptionDirty={transcriptionDirty}
          resetTranscription={resetTranscription}
          saveTranscription={saveTranscription}
          wavesurferOptions={wavesurfer?.options}
          setWavesurferOptions={(options) => wavesurfer?.setOptions(options)}
          displayInlineCaption={displayInlineCaption}
          setDisplayInlineCaption={setDisplayInlineCaption}
          onShare={onShare}
        />
      </div>

      {initialized && (
        <div className={recordButtonVisible && mediaProvider ? "" : "hidden"}>
          <MediaCaption
            key={`${mediaId}-${currentSegmentIndex}`}
            mediaId={mediaId}
            mediaType={mediaType}
            currentTime={currentTime}
            transcription={transcriptionResult?.[currentSegmentIndex]}
            onSeek={(time) => {
              wavesurfer.seekTo(time / wavesurfer.getDuration());
            }}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </div>
      )}

      <div
        className={recordButtonVisible && mediaProvider ? "hidden" : "flex-1"}
      >
        <VidstackMediaPlayer
          src={mediaUrl}
          onCanPlayThrough={(detail, nativeEvent) => {
            mediaRemote.setTarget(nativeEvent.target);
            const { provider } = detail;
            if (isAudioProvider(provider)) {
              setMediaProvider(provider.audio);
            } else if (isVideoProvider(provider)) {
              setMediaProvider(provider.video);
            }
          }}
        >
          <MediaProvider />

          {mediaType === "Audio" && (
            <DefaultAudioLayout icons={defaultLayoutIcons} />
          )}

          {mediaType === "Video" && (
            <>
              <DefaultVideoLayout icons={defaultLayoutIcons} />
              <div className="vds-captions">
                <div className="absolute mx-auto bottom-[15%] flex items-center justify-center w-full">
                  <div className="flex">
                    <MediaCaption
                      mediaId={mediaId}
                      mediaType={mediaType}
                      className="mx-auto w-5/6 text-center bg-primary/70 text-xl text-white"
                      transcription={transcriptionResult?.[currentSegmentIndex]}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                      setIsPlaying={setIsPlaying}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </VidstackMediaPlayer>
      </div>
    </>
  );
};
