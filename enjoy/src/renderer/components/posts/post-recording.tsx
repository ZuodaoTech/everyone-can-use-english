import { useEffect, useState, useRef, useCallback, useContext } from "react";
import { renderPitchContour } from "@renderer/lib/utils";
import { extractFrequencies } from "@/utils";
import WaveSurfer from "wavesurfer.js";
import { Button, Skeleton } from "@renderer/components/ui";
import { PlayIcon, PauseIcon } from "lucide-react";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { secondsToTimestamp } from "@renderer/lib/utils";
import { t } from "i18next";
import { XCircleIcon } from "lucide-react";
import { AppSettingsProviderContext } from "@renderer/context";
import { WavesurferPlayer } from "@renderer/components";

export const PostRecording = (props: {
  recording: RecordingType;
  height?: number;
}) => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const { recording, height = 80 } = props;
  const [initialized, setInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wavesurfer, setWavesurfer] = useState(null);
  const containerRef = useRef();
  const [ref, entry] = useIntersectionObserver({
    threshold: 1,
  });
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string>(null);
  const [segment, setSegment] = useState<SegmentType>(null);

  const onPlayClick = useCallback(() => {
    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  }, [wavesurfer]);

  const fetchSegment = async () => {
    if (segment) return;

    webApi
      .mineSegments({
        targetId: recording.targetId,
        targetType: recording.targetType,
        segmentIndex: recording.referenceId,
      })
      .then((res) => {
        if (res.segments.length === 0) return;

        setSegment(res.segments[0]);
      });
  };

  useEffect(() => {
    // use the intersection observer to only create the wavesurfer instance
    // when the player is visible
    if (!entry?.isIntersecting) return;
    if (!recording.src) return;
    if (wavesurfer) return;
    if (error) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: recording.src,
      height,
      barWidth: 1,
      cursorWidth: 0,
      autoCenter: true,
      autoScroll: true,
      dragToSeek: true,
      hideScrollbar: true,
      minPxPerSec: 100,
      waveColor: "rgba(0, 0, 0, 0.25)",
      progressColor: "rgba(0, 0, 0, 0.5)",
    });

    setWavesurfer(ws);

    fetchSegment();

    return () => {
      setWavesurfer(null);
    };
  }, [recording.src, entry, error]);

  useEffect(() => {
    if (!wavesurfer) return;

    const subscriptions = [
      wavesurfer.on("play", () => {
        setIsPlaying(true);
      }),
      wavesurfer.on("pause", () => {
        setIsPlaying(false);
      }),
      wavesurfer.on("ready", () => {
        setDuration(wavesurfer.getDuration());
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
                pointRadius: 1,
                borderColor: "#fb6f92",
                pointBorderColor: "#fb6f92",
                pointBackgroundColor: "#ff8fab",
              },
            ],
          });
        }, 1000);
        setInitialized(true);
      }),
      wavesurfer.on("error", (err: Error) => {
        setError(err.message);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
      wavesurfer?.destroy();
    };
  }, [wavesurfer]);

  if (error) {
    return (
      <div className="w-full bg-sky-500/30 rounded-lg p-4 border">
        <div className="flex items-center justify-center mb-2">
          <XCircleIcon className="w-4 h-4 text-destructive" />
        </div>
        <div className="select-text break-all text-center text-sm text-muted-foreground mb-4">
          {error}
        </div>
        <div className="flex items-center justify-center">
          <Button onClick={() => setError(null)}>{t("retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          {secondsToTimestamp(duration)}
        </span>
      </div>

      <div
        ref={ref}
        className="bg-sky-500/30 rounded-lg grid grid-cols-9 items-center relative h-[80px]"
      >
        {!initialized && (
          <div className="col-span-9 flex flex-col justify-around h-[80px]">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
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

      {recording.referenceText && (
        <div className="my-2 bg-muted px-4 py-2 rounded">
          <div className="text-muted-foreground text-center font-serif select-text">
            {recording.referenceText}
          </div>
        </div>
      )}

      {segment?.src && <WavesurferPlayer id={segment.id} src={segment.src} />}
    </div>
  );
};
