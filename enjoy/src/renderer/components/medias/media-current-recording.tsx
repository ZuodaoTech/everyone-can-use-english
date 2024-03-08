import { useEffect, useContext, useRef } from "react";
import {
  MediaPlayerProviderContext,
} from "@renderer/context";
import { extractFrequencies, MediaRecorder } from "@renderer/components";
import WaveSurfer from "wavesurfer.js";
import Chart from "chart.js/auto";

export const MediaCurrentRecording = () => {
  const { recordings, isRecording, setIsRecording, currentRecording } =
    useContext(MediaPlayerProviderContext);

  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (isRecording) return;
    if (!currentRecording?.src) return;

    const height = 150;
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
    <div className="border-t bg-blue-500/10">
      <div ref={ref}></div>
    </div>
  );
};
