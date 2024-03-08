import { createContext, useEffect, useState, useContext } from "react";
import { extractFrequencies, PitchContour } from "@renderer/components";
import { AppSettingsProviderContext } from "@renderer/context";
import { useTranscriptions, useRecordings } from "@renderer/hooks";
import WaveSurfer from "wavesurfer.js";
import Regions, {
  type Region as RegionType,
} from "wavesurfer.js/dist/plugins/regions";
import Chart from "chart.js/auto";

type MediaPlayerContextType = {
  media: AudioType | VideoType;
  setMedia: (media: AudioType | VideoType) => void;
  setMediaProvider: (mediaProvider: HTMLAudioElement | null) => void;
  waveform: WaveFormDataType;
  // wavesurfer
  wavesurfer: WaveSurfer;
  setRef: (ref: any) => void;
  decoded: boolean;
  // player state
  currentTime: number;
  currentSegmentIndex: number;
  setCurrentSegmentIndex: (index: number) => void;
  fitZoomRatio: number;
  minPxPerSec: number;
  // regions
  regions: Regions | null;
  activeRegion: RegionType;
  setActiveRegion: (region: RegionType) => void;
  editingRegion: boolean;
  setEditingRegion: (editing: boolean) => void;
  renderPitchContour: (region: RegionType) => void;
  pitchChart: Chart;
  // Transcription
  transcription: TranscriptionType;
  generateTranscription: () => void;
  transcribing: boolean;
  transcribingProgress: number;
  transcriptionDraft: TranscriptionType["result"];
  setTranscriptionDraft: (result: TranscriptionType["result"]) => void;
  // Recordings
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  currentRecording: RecordingType;
  setCurrentRecording: (recording: RecordingType) => void;
  recordings: RecordingType[];
  fetchRecordings: () => void;
  loadingRecordings: boolean;
  hasMoreRecordings: boolean;
};

export const MediaPlayerProviderContext =
  createContext<MediaPlayerContextType>(null);

export const MediaPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const minPxPerSec = 150;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const [media, setMedia] = useState<AudioType | VideoType>(null);
  const [mediaProvider, setMediaProvider] = useState<HTMLAudioElement | null>(
    null
  );
  const [waveform, setWaveForm] = useState<WaveFormDataType>(null);
  const [wavesurfer, setWavesurfer] = useState(null);

  const [regions, setRegions] = useState<Regions | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionType>(null);
  const [editingRegion, setEditingRegion] = useState<boolean>(false);
  const [pitchChart, setPitchChart] = useState<Chart>(null);

  const [ref, setRef] = useState(null);

  // Player state
  const [decoded, setDecoded] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [fitZoomRatio, setFitZoomRatio] = useState<number>(1.0);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentRecording, setCurrentRecording] = useState<RecordingType>(null);

  const [transcriptionDraft, setTranscriptionDraft] =
    useState<TranscriptionType["result"]>();

  const {
    transcription,
    generateTranscription,
    transcribing,
    transcribingProgress,
  } = useTranscriptions(media);

  const {
    recordings,
    fetchRecordings,
    loading: loadingRecordings,
    hasMore: hasMoreRecordings,
  } = useRecordings(media, currentSegmentIndex);

  const initializeWavesurfer = async () => {
    if (!media) return;
    if (!mediaProvider) return;
    if (!ref.current) return;

    const ws = WaveSurfer.create({
      container: ref.current,
      height: 250,
      waveColor: "#eaeaea",
      progressColor: "#c0d6df",
      cursorColor: "#ff0054",
      barWidth: 2,
      autoScroll: true,
      minPxPerSec,
      autoCenter: false,
      dragToSeek: false,
      fillParent: true,
      media: mediaProvider,
      peaks: waveform ? [waveform.peaks] : undefined,
      duration: waveform ? waveform.duration : undefined,
    });

    const blob = await fetch(media.src).then((res) => res.blob());

    if (waveform) {
      ws.loadBlob(blob, [waveform.peaks], waveform.duration);
      setDecoded(true);
    } else {
      ws.loadBlob(blob);
    }

    setWavesurfer(ws);
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
              beginAtZero: true,
              display: false,
            },
          },
        },
      })
    );
  };

  useEffect(() => {
    if (!media) return;

    EnjoyApp.waveforms.find(media.md5).then((waveform) => {
      setWaveForm(waveform);
    });
  }, [media]);

  /*
   * Initialize wavesurfer when container ref is available
   * and mediaProvider is available
   */
  useEffect(() => {
    initializeWavesurfer();
  }, [media, ref, mediaProvider]);

  /*
   * When wavesurfer is decoded,
   * set up event listeners for wavesurfer
   * and clean up when component is unmounted
   */
  useEffect(() => {
    if (!wavesurfer) return;

    setRegions(wavesurfer.registerPlugin(Regions.create()));

    setCurrentTime(0);

    const subscriptions = [
      wavesurfer.on("loading", (percent: number) => console.log(`${percent}%`)),
      wavesurfer.on("timeupdate", (time: number) => setCurrentTime(time)),
      wavesurfer.on("decode", () => {
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
        EnjoyApp.waveforms.save(media.md5, _waveform);
        setWaveForm(_waveform);
      }),
      wavesurfer.on("ready", () => {
        setDecoded(true);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer]);

  /*
   * update fitZoomRatio when currentSegmentIndex is updated
   */
  useEffect(() => {
    if (!ref?.current) return;
    if (!wavesurfer) return;
    if (!transcription?.result) return;

    const currentSegment = transcription?.result?.[currentSegmentIndex];
    if (!currentSegment) return;

    const containerWidth = ref.current.getBoundingClientRect().width;
    const duration =
      currentSegment.offsets.to / 1000.0 - currentSegment.offsets.from / 1000.0;

    setFitZoomRatio(containerWidth / duration / minPxPerSec);
  }, [ref, wavesurfer, transcription, currentSegmentIndex]);

  useEffect(() => {
    if (!activeRegion) return;

    renderPitchContour(activeRegion);
  }, [activeRegion])

  return (
    <MediaPlayerProviderContext.Provider
      value={{
        media,
        setMedia,
        setMediaProvider,
        wavesurfer,
        setRef,
        decoded,
        currentTime,
        currentSegmentIndex,
        setCurrentSegmentIndex,
        waveform,
        fitZoomRatio,
        minPxPerSec,
        transcription,
        regions,
        renderPitchContour,
        pitchChart,
        activeRegion,
        setActiveRegion,
        editingRegion,
        setEditingRegion,
        generateTranscription,
        transcribing,
        transcribingProgress,
        transcriptionDraft,
        setTranscriptionDraft,
        isRecording,
        setIsRecording,
        currentRecording,
        setCurrentRecording,
        recordings,
        fetchRecordings,
        loadingRecordings,
        hasMoreRecordings,
      }}
    >
      {children}
    </MediaPlayerProviderContext.Provider>
  );
};
