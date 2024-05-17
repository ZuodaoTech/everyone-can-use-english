import { renderPitchContour, secondsToTimestamp } from "@renderer/lib/utils";
import { extractFrequencies } from "@/utils";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button, Skeleton } from "@renderer/components/ui";
import { PauseIcon, PlayIcon } from "lucide-react";

export const WavesurferPlayer = (props: {
  id: string;
  src: string;
  height?: number;
  currentTime?: number;
  setCurrentTime?: (currentTime: number) => void;
  onError?: (error: Error) => void;
}) => {
  const { id, src, height = 80, onError, setCurrentTime } = props;
  const [initialized, setInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wavesurfer, setWavesurfer] = useState(null);
  const containerRef = useRef();
  const [ref, entry] = useIntersectionObserver({
    threshold: 1,
  });
  const [duration, setDuration] = useState<number>(0);

  const onPlayClick = useCallback(() => {
    if (!wavesurfer) return;

    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  }, [wavesurfer]);

  useEffect(() => {
    // use the intersection observer to only create the wavesurfer instance
    // when the player is visible
    if (!entry?.isIntersecting) return;
    if (!src) return;
    if (wavesurfer) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: src,
      height,
      barWidth: 1,
      cursorWidth: 0,
      autoCenter: true,
      autoScroll: true,
      dragToSeek: true,
      hideScrollbar: true,
      minPxPerSec: 100,
      waveColor: "#ddd",
      progressColor: "rgba(0, 0, 0, 0.25)",
    });

    setWavesurfer(ws);
  }, [src, entry]);

  useEffect(() => {
    if (!wavesurfer) return;

    const subscriptions = [
      wavesurfer.on("play", () => {
        setIsPlaying(true);
      }),
      wavesurfer.on("pause", () => {
        setIsPlaying(false);
      }),
      wavesurfer.on("timeupdate", (time: number) => {
        setCurrentTime && setCurrentTime(time);
      }),
      wavesurfer.on("ready", () => {
        setDuration(wavesurfer.getDuration());
        const peaks = wavesurfer.getDecodedData().getChannelData(0);
        const sampleRate = wavesurfer.options.sampleRate;
        const data = extractFrequencies({ peaks, sampleRate });
        setTimeout(() => {
          renderPitchContour({
            wrapper: wavesurfer.getWrapper(),
            canvasId: `pitch-contour-${id}-canvas`,
            labels: new Array(data.length).fill(""),
            datasets: [
              {
                data,
                cubicInterpolationMode: "monotone",
                pointRadius: 1,
              },
            ],
          });
        }, 1000);
        setInitialized(true);
      }),
      wavesurfer.on("error", (err: Error) => {
        onError(err);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
      wavesurfer?.destroy();
    };
  }, [wavesurfer]);

  return (
    <>
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          {secondsToTimestamp(duration)}
        </span>
      </div>

      <div
        ref={ref}
        className="bg-background rounded-lg grid grid-cols-9 items-center relative h-[80px]"
      >
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
          className={`col-span-8 ${initialized ? "" : "hidden"}`}
          ref={containerRef}
        ></div>
      </div>
    </>
  );
};
