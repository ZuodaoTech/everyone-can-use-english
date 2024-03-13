import { useEffect, useContext, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { extractFrequencies, MediaRecorder } from "@renderer/components";
import WaveSurfer from "wavesurfer.js";
import Chart from "chart.js/auto";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
  toast,
} from "@renderer/components/ui";
import { PauseIcon, PlayIcon, Share2Icon } from "lucide-react";
import { t } from "i18next";

export const MediaCurrentRecording = (props: { height?: number }) => {
  const { height = 96 } = props;
  const { recordings, isRecording, setIsRecording, currentRecording } =
    useContext(MediaPlayerProviderContext);
  const { webApi, EnjoyApp } = useContext(AppSettingsProviderContext);
  const [player, setPlayer] = useState<WaveSurfer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const ref = useRef(null);

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
      cursorWidth: 0,
      autoCenter: false,
      autoScroll: true,
      hideScrollbar: true,
      minPxPerSec: 100,
      waveColor: "#efefef",
      normalize: false,
      progressColor: "rgba(0, 0, 0, 0.25)",
    });

    setPlayer(ws);

    ws.on("timeupdate", (time: number) => setCurrentTime(time));

    ws.on("finish", () => ws.seekTo(0));

    ws.on("decode", () => {
      const wrapper = (ws as any).renderer.getWrapper();
      const width = wrapper.getBoundingClientRect().width;
      const canvas = document.createElement("canvas");
      const canvasId = `pitch-contour-${currentRecording.id}-canvas`;
      canvas.id = canvasId;
      canvas.style.position = "absolute";
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.top = "0";
      canvas.style.left = "0";

      wrapper.appendChild(canvas);

      const peaks: Float32Array = ws.getDecodedData().getChannelData(0);
      const sampleRate = ws.options.sampleRate;
      const data = extractFrequencies({ peaks, sampleRate });

      new Chart(canvas, {
        type: "line",
        data: {
          labels: data.map((_, i) => ""),
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
              display: false,
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
      });
    });

    return () => {
      ws.destroy();
    };
  }, [ref, currentRecording, isRecording]);

  if (isRecording) return <MediaRecorder />;
  if (!currentRecording?.src) return null;

  return (
    <div className="flex space-x-4 relative">
      <div className="border rounded-xl shadow flex-1" ref={ref}></div>
      <div className="flex flex-col space-y-2">
        <Button
          variant="default"
          size="icon"
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              data-tooltip-id="media-player-controls-tooltip"
              data-tooltip-content={t("share")}
              className="rounded-full w-8 h-8 p-0"
            >
              <Share2Icon className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>

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
      </div>
    </div>
  );
};
