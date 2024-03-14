import { useEffect, useState, useRef, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { renderPitchContour } from "@renderer/lib/utils";
import { extractFrequencies } from "@/utils";
import { Button, Skeleton } from "@renderer/components/ui";
import { PlayIcon, PauseIcon } from "lucide-react";
import { useIntersectionObserver } from "@uidotdev/usehooks";

export const RecordingPlayer = (props: {
  recording: RecordingType;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  id?: string;
  height?: number;
  onCurrentTimeChange?: (time: number) => void;
  seek?: {
    seekTo: number;
    timestamp: number;
  };
}) => {
  const {
    recording,
    height = 100,
    onCurrentTimeChange,
    seek,
    isPlaying,
    setIsPlaying,
  } = props;
  const [wavesurfer, setWavesurfer] = useState(null);
  const containerRef = useRef();
  const [ref, entry] = useIntersectionObserver({
    threshold: 0,
  });
  const [initialized, setInitialized] = useState(false);

  const onPlayClick = useCallback(() => {
    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  }, [wavesurfer]);

  useEffect(() => {
    // use the intersection observer to only create the wavesurfer instance
    // when the player is visible
    if (!entry?.isIntersecting) return;
    if (!recording?.src) return;
    if (wavesurfer) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: recording.src,
      height,
      barWidth: 1,
      cursorWidth: 0,
      autoCenter: false,
      autoScroll: true,
      hideScrollbar: true,
      minPxPerSec: 100,
      waveColor: "#ddd",
      normalize: true,
      progressColor: "rgba(0, 0, 0, 0.25)",
    });

    setWavesurfer(ws);
  }, [recording, entry]);

  useEffect(() => {
    if (!wavesurfer) return;

    const subscriptions = [
      wavesurfer.on("play", () => setIsPlaying(true)),
      wavesurfer.on("pause", () => setIsPlaying(false)),
      wavesurfer.on("timeupdate", (time: number) => {
        onCurrentTimeChange?.(time);
      }),
      wavesurfer.on("ready", () => {
        const peaks = wavesurfer.getDecodedData().getChannelData(0);
        const sampleRate = wavesurfer.options.sampleRate;
        const data = extractFrequencies({ peaks, sampleRate });
        setTimeout(() => {
          renderPitchContour({
            wrapper: wavesurfer.getWrapper(),
            canvasId: `pitch-contour-${recording.id}-canvas`,
            labels: new Array(data.length).fill(""),
            datasets: [
              {
                data,
                cubicInterpolationMode: "monotone",
              },
            ],
          });
        }, 1000);
        setInitialized(true);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
      wavesurfer?.destroy();
    };
  }, [wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) return;
    if (!seek?.seekTo) return;

    wavesurfer.seekTo(seek.seekTo / wavesurfer.getDuration());
  }, [seek, wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) return;
    if (isPlaying) {
      wavesurfer.play();
    } else {
      wavesurfer.pause();
    }
  }, [isPlaying, wavesurfer]);

  return (
    <div ref={ref} className="grid grid-cols-11 xl:grid-cols-12 items-center">
      {!initialized && (
        <div className="col-span-9 flex flex-col justify-around h-[80px]">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      )}

      <div className={`flex justify-center ${initialized ? "" : "hidden"}`}>
        <Button
          onClick={onPlayClick}
          className="aspect-square rounded-full p-2 w-12 h-12 bg-blue-600 hover:bg-blue-500"
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6 text-white" />
          ) : (
            <PlayIcon className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>

      <div
        className={`col-span-10 xl:col-span-11 ${initialized ? "" : "hidden"}`}
        ref={containerRef}
      ></div>
    </div>
  );
};
