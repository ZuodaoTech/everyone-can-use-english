import { createContext, useEffect, useState, useContext, useMemo } from "react";
import { convertIpaToNormal, extractFrequencies } from "@/utils";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  useTranscriptions,
  useRecordings,
  useSegments,
  useNotes,
} from "@renderer/hooks";
import WaveSurfer from "wavesurfer.js";
import Regions, {
  type Region as RegionType,
} from "wavesurfer.js/dist/plugins/regions";
import Chart from "chart.js/auto";
import {
  Timeline,
  TimelineEntry,
} from "echogarden/dist/utilities/Timeline.d.js";
import { toast } from "@renderer/components/ui";
import { Tooltip } from "react-tooltip";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { t } from "i18next";
import { SttEngineOptionEnum } from "@/types/enums";
import { useNavigate } from "react-router-dom";

const ONE_MINUTE = 60;
const TEN_MINUTES = 10 * ONE_MINUTE;

type MediaShadowContextType = {
  layout: "compact" | "normal";
  onCancel: () => void;
  media: AudioType | VideoType;
  setMedia: (media: AudioType | VideoType) => void;
  setMediaProvider: (mediaProvider: HTMLAudioElement | null) => void;
  waveform: WaveFormDataType;
  // wavesurfer
  wavesurfer: WaveSurfer;
  setWaveformContainerRef: (ref: any) => void;
  decoded: boolean;
  decodeError: string;
  setDecodeError: (error: string) => void;
  // player state
  currentTime: number;
  currentSegmentIndex: number;
  setCurrentSegmentIndex: (index: number) => void;
  zoomRatio: number;
  setZoomRatio: (zoomRation: number) => void;
  fitZoomRatio: number;
  minPxPerSec: number;
  // regions
  regions: Regions | null;
  activeRegion: RegionType;
  setActiveRegion: (region: RegionType) => void;
  toggleRegion: (params: number[]) => void;
  renderPitchContour: (
    region: RegionType,
    options?: {
      repaint?: boolean;
      canvasId?: string;
      containerClassNames?: string[];
      data?: Chart["data"];
    }
  ) => void;
  editingRegion: boolean;
  setEditingRegion: (editing: boolean) => void;
  pitchChart: Chart;
  // Transcription
  transcription: TranscriptionType;
  generateTranscription: (params?: {
    originalText?: string;
    language?: string;
    model?: string;
    service?: SttEngineOptionEnum | "upload";
    isolate?: boolean;
  }) => Promise<void>;
  transcribing: boolean;
  transcribingProgress: number;
  transcribingOutput: string;
  transcriptionDraft: TranscriptionType["result"];
  setTranscriptionDraft: (result: TranscriptionType["result"]) => void;
  caption: TimelineEntry;
  // Recordings
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
  togglePauseResume: () => void;
  recordingBlob: Blob;
  isRecording: boolean;
  isPaused: boolean;
  recordingType: string;
  setRecordingType: (type: string) => void;
  recordingTime: number;
  mediaRecorder: MediaRecorder;
  currentRecording: RecordingType;
  setCurrentRecording: (recording: RecordingType) => void;
  recordings: RecordingType[];
  fetchRecordings: (offset: number) => void;
  loadingRecordings: boolean;
  // Notes
  currentNotes: NoteType[];
  createNote: (params: any) => void;
  // Segments
  currentSegment: SegmentType;
  createSegment: () => Promise<SegmentType | void>;
  getCachedSegmentIndex: () => Promise<number>;
  setCachedSegmentIndex: (index: number) => void;
};

export const MediaShadowProviderContext =
  createContext<MediaShadowContextType>(null);

export const MediaShadowProvider = ({
  children,
  layout = "normal",
  onCancel,
}: {
  children: React.ReactNode;
  layout?: "compact" | "normal";
  onCancel?: () => void;
}) => {
  const minPxPerSec = 150;
  const { EnjoyApp, learningLanguage, recorderConfig } = useContext(
    AppSettingsProviderContext
  );
  const navigate = useNavigate();

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

  const [waveformContainerRef, setWaveformContainerRef] = useState(null);

  //  Player state
  const [decoded, setDecoded] = useState<boolean>(false);
  const [decodeError, setDecodeError] = useState<string>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [fitZoomRatio, setFitZoomRatio] = useState<number>(1.0);
  const [zoomRatio, setZoomRatio] = useState<number>(1.0);

  const [currentRecording, setCurrentRecording] = useState<RecordingType>(null);
  const [recordingType, setRecordingType] = useState<string>("segment");
  const [cancelingRecording, setCancelingRecording] = useState(false);

  const [transcriptionDraft, setTranscriptionDraft] =
    useState<TranscriptionType["result"]>();

  const {
    transcription,
    generateTranscription,
    transcribing,
    transcribingProgress,
    transcribingOutput,
    abortGenerateTranscription,
  } = useTranscriptions(media);

  const cancelRecording = () => {
    setCancelingRecording(true);
  };

  const {
    recordings,
    fetchRecordings,
    loading: loadingRecordings,
  } = useRecordings(media, currentSegmentIndex);

  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  } = useAudioRecorder(recorderConfig, (exception) => {
    toast.error(exception.message);
  });

  const caption = useMemo(() => {
    return (transcription?.result?.timeline as Timeline)?.[currentSegmentIndex];
  }, [currentSegmentIndex, transcription]);

  const { segment, createSegment } = useSegments({
    targetId: media?.id,
    targetType: media?.mediaType,
    segmentIndex: currentSegmentIndex,
  });

  const getCachedSegmentIndex = async () => {
    if (!media) return;

    const cachedId = `${media.mediaType.toLowerCase()}-${
      media.id
    }-last-segment-index`;
    const index = await EnjoyApp.cacheObjects.get(cachedId);

    return index || 0;
  };

  const setCachedSegmentIndex = (index: number) => {
    if (!media) return;

    const cachedId = `${media.mediaType.toLowerCase()}-${
      media.id
    }-last-segment-index`;
    return EnjoyApp.cacheObjects.set(cachedId, index);
  };

  const { notes, createNote } = useNotes({
    targetId: segment?.id,
    targetType: "Segment",
  });

  const initializeWavesurfer = async () => {
    if (!media) return;
    if (!mediaProvider) return;
    if (!waveformContainerRef?.current) return;

    const height =
      waveformContainerRef.current.getBoundingClientRect().height - 10; // -10 to leave space for scrollbar
    const container = waveformContainerRef.current.querySelector(
      ".waveform-container"
    );
    if (!container) return;

    const ws = WaveSurfer.create({
      container: container as HTMLElement,
      height,
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

  const renderPitchContour = (
    region: RegionType,
    options?: {
      repaint?: boolean;
      canvasId?: string;
      containerClassNames?: string[];
      data?: Chart["data"];
    }
  ) => {
    if (!region) return;
    if (!waveform?.frequencies?.length) return;
    if (!wavesurfer) return;
    if (!waveformContainerRef?.current) return;

    const caption = transcription?.result?.timeline?.[currentSegmentIndex];
    if (!caption) return;

    const { repaint = true, containerClassNames = [] } = options || {};
    const duration = wavesurfer.getDuration();
    const fromIndex = Math.round(
      (region.start / duration) * waveform.frequencies.length
    );
    const toIndex = Math.round(
      (region.end / duration) * waveform.frequencies.length
    );

    const wrapper = (wavesurfer as any).renderer.getWrapper();
    if (!wrapper) return;

    // remove existing pitch contour
    if (repaint) {
      wrapper
        .querySelectorAll(".pitch-contour")
        .forEach((element: HTMLDivElement) => {
          element.remove();
        });
    }

    // calculate offset and width
    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const height = waveformContainerRef.current.getBoundingClientRect().height;
    const offsetLeft = (region.start / duration) * wrapperWidth;
    const width = ((region.end - region.start) / duration) * wrapperWidth;

    // create container and canvas
    const pitchContourWidthContainer = document.createElement("div");
    const canvas = document.createElement("canvas");
    const canvasId = options?.canvasId || `pitch-contour-${region.id}-canvas`;
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
    pitchContourWidthContainer.classList.add(
      "pitch-contour",
      ...containerClassNames
    );
    // pitchContourWidthContainer.style.zIndex = "3";

    wrapper.appendChild(pitchContourWidthContainer);

    // prepare chart data
    let chartData: Chart["data"] = options?.data;

    if (!chartData) {
      const data = waveform.frequencies.slice(fromIndex, toIndex);
      const regionDuration = region.end - region.start;

      const labels = new Array(data.length).fill("");
      if (region.id.startsWith("segment-region")) {
        caption.timeline.forEach((segment: TimelineEntry) => {
          const index = Math.round(
            ((segment.startTime - region.start) / regionDuration) * data.length
          );
          labels[index] = segment.text.trim();
        });
      } else if (region.id.startsWith("meaning-group-region")) {
        const words = caption.timeline.filter(
          (w: TimelineEntry) =>
            w.startTime >= region.start &&
            w.endTime <= region.end &&
            w.type === "word"
        );
        words.forEach((word: TimelineEntry) => {
          const index = Math.round(
            ((word.startTime - region.start) / regionDuration) * data.length
          );
          labels[index] = word.text.trim();
        });
      } else if (region.id.startsWith("word-region")) {
        const words = caption.timeline.filter(
          (w: TimelineEntry) =>
            w.startTime >= region.start &&
            w.endTime <= region.end &&
            w.type === "word"
        );

        let phones: TimelineEntry[] = [];
        words.forEach((word: TimelineEntry) => {
          word.timeline?.forEach((token: TimelineEntry) => {
            phones = phones.concat(token.timeline);
          });
        });

        phones.forEach((phone: TimelineEntry) => {
          const index = Math.round(
            ((phone.startTime - region.start) / regionDuration) * data.length
          );
          labels[index] = [
            labels[index] || "",
            (media?.language || learningLanguage).startsWith("en")
              ? convertIpaToNormal(phone.text.trim())
              : phone.text.trim(),
          ].join("");
        });
      }

      chartData = {
        labels,
        datasets: [
          {
            data,
            cubicInterpolationMode: "monotone",
          },
        ],
      };
    }

    setPitchChart(
      new Chart(canvas, {
        type: "line",
        data: chartData,
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

  const onRecorded = async (blob: Blob) => {
    if (cancelingRecording) {
      setCancelingRecording(false);
      return;
    }
    if (!blob) return;
    if (!media) return;
    if (!transcription?.result?.timeline) return;

    let referenceId = -1;
    let referenceText = transcription.result.timeline
      .map((s: TimelineEntry) => s.text)
      .join("\n");

    if (recordingType === "segment") {
      const currentSegment =
        transcription?.result?.timeline?.[currentSegmentIndex];
      if (!currentSegment) return;

      referenceId = currentSegmentIndex;
      referenceText = currentSegment.text;
    }

    EnjoyApp.recordings
      .create({
        targetId: media.id,
        targetType: media.mediaType,
        blob: {
          type: recordingBlob.type.split(";")[0],
          arrayBuffer: await blob.arrayBuffer(),
        },
        referenceId,
        referenceText,
      })
      .then(() =>
        toast.success(t("recordingSaved"), { position: "bottom-right" })
      )
      .catch((err) =>
        toast.error(t("failedToSaveRecording" + " : " + err.message))
      );
  };

  const toggleRegion = (params: number[]) => {
    if (!activeRegion) return;
    if (editingRegion) {
      toast.warning(t("currentRegionIsBeingEdited"));
      return;
    }
    if (params.length === 0) {
      if (activeRegion.id.startsWith("word-region")) {
        activeRegion.remove();
        setActiveRegion(
          regions.getRegions().find((r) => r.id.startsWith("segment-region"))
        );
      }
      return;
    }

    const startIndex = Math.min(...params);
    const endIndex = Math.max(...params);

    const startWord = caption.timeline[startIndex];
    if (!startWord) return;

    const endWord = caption.timeline[endIndex] || startWord;

    const start = startWord.startTime;
    const end = endWord.endTime;

    // If the active region is a word region, then merge the selected words into a single region.
    if (activeRegion.id.startsWith("word-region")) {
      activeRegion.remove();

      const region = regions.addRegion({
        id: `word-region-${startIndex}`,
        start,
        end,
        color: "#fb6f9233",
        drag: false,
        resize: editingRegion,
      });

      setActiveRegion(region);
      // If the active region is a meaning group region, then active the segment region.
    } else if (activeRegion.id.startsWith("meaning-group-region")) {
      setActiveRegion(
        regions.getRegions().find((r) => r.id.startsWith("segment-region"))
      );
      // If the active region is a segment region, then create a new word region.
    } else {
      const region = regions.addRegion({
        id: `word-region-${startIndex}`,
        start,
        end,
        color: "#fb6f9233",
        drag: false,
        resize: false,
      });

      setActiveRegion(region);
    }
  };

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
      wavesurfer.on("timeupdate", (time: number) =>
        setCurrentTime(Math.ceil(time * 100) / 100)
      ),
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
      wavesurfer.on("error", (err: Error) => {
        toast.error(err?.message || "Error occurred while decoding audio");
        setDecodeError(err?.message || "Error occurred while decoding audio");
        // Reload page when error occurred after decoding
        if (decoded) {
          window.location.reload();
        }
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
      wavesurfer?.destroy();
    };
  }, [wavesurfer]);

  /*
   * update fitZoomRatio when currentSegmentIndex is updated
   */
  useEffect(() => {
    if (!waveformContainerRef?.current) return;
    if (!wavesurfer) return;

    if (!activeRegion) return;

    const containerWidth =
      waveformContainerRef.current.getBoundingClientRect().width;
    const duration = activeRegion.end - activeRegion.start;
    if (activeRegion.id.startsWith("word-region")) {
      setFitZoomRatio(containerWidth / 3 / duration / minPxPerSec);
    } else {
      setFitZoomRatio(containerWidth / duration / minPxPerSec);
    }

    return () => {
      setFitZoomRatio(1.0);
    };
  }, [waveformContainerRef, wavesurfer, activeRegion]);

  /*
   * Zoom chart when zoomRatio update
   */
  useEffect(() => {
    if (!wavesurfer) return;
    if (!decoded) return;

    wavesurfer.zoom(zoomRatio * minPxPerSec);
    if (!activeRegion) return;

    renderPitchContour(activeRegion);
    wavesurfer.setScrollTime(activeRegion.start);
  }, [zoomRatio, wavesurfer, decoded]);

  /*
   * Re-render pitch contour when active region changed
   */
  useEffect(() => {
    if (!activeRegion) return;
    if (!wavesurfer) return;

    renderPitchContour(activeRegion);
  }, [wavesurfer, activeRegion]);

  /*
   * Update player styles
   */
  useEffect(() => {
    if (!wavesurfer) return;
    if (!decoded) return;

    const scrollContainer = wavesurfer.getWrapper().closest(".scroll");
    scrollContainer.style.scrollbarWidth = "thin";
  }, [decoded, wavesurfer]);

  useEffect(() => {
    if (!media) return;

    EnjoyApp.waveforms.find(media.md5).then((waveform) => {
      setWaveForm(waveform);
    });
  }, [media?.md5]);

  /*
   * Initialize wavesurfer when container ref is available
   * and mediaProvider is available
   */
  useEffect(() => {
    initializeWavesurfer();

    return () => {
      if (wavesurfer) wavesurfer.destroy();
      setDecoded(false);
      setDecodeError(null);
    };
  }, [media?.src, waveformContainerRef?.current, mediaProvider]);

  /* cache last segment index */
  useEffect(() => {
    if (!media) return;
    if (typeof currentSegmentIndex !== "number") return;

    setCachedSegmentIndex(currentSegmentIndex);
  }, [currentSegmentIndex]);

  /*
   * Abort transcription when component is unmounted
   */
  useEffect(() => {
    return () => {
      abortGenerateTranscription();
    };
  }, []);

  /**
   * create recording when recordingBlob is updated
   */
  useEffect(() => {
    onRecorded(recordingBlob);
  }, [recordingBlob]);

  useEffect(() => {
    if (cancelingRecording) {
      stopRecording();
    }
  }, [cancelingRecording]);

  /**
   * auto stop recording when recording time is over
   */
  useEffect(() => {
    if (!isRecording) return;

    if (recordingType === "segment" && recordingTime >= ONE_MINUTE) {
      stopRecording();
    } else if (recordingTime >= TEN_MINUTES) {
      stopRecording();
    }
  }, [recordingTime, recordingType]);

  return (
    <>
      <MediaShadowProviderContext.Provider
        value={{
          layout,
          onCancel: onCancel || (() => navigate(-1)),
          media,
          setMedia,
          setMediaProvider,
          wavesurfer,
          setWaveformContainerRef,
          decoded,
          decodeError,
          setDecodeError,
          currentTime,
          currentSegmentIndex,
          setCurrentSegmentIndex,
          waveform,
          zoomRatio,
          setZoomRatio,
          fitZoomRatio,
          minPxPerSec,
          transcription,
          regions,
          pitchChart,
          activeRegion,
          setActiveRegion,
          toggleRegion,
          renderPitchContour,
          editingRegion,
          setEditingRegion,
          generateTranscription,
          transcribing,
          transcribingProgress,
          transcribingOutput,
          transcriptionDraft,
          setTranscriptionDraft,
          caption,
          startRecording,
          stopRecording,
          cancelRecording,
          togglePauseResume,
          recordingBlob,
          isRecording,
          isPaused,
          recordingType,
          setRecordingType,
          recordingTime,
          mediaRecorder,
          currentRecording,
          setCurrentRecording,
          recordings,
          fetchRecordings,
          loadingRecordings,
          currentNotes: notes,
          createNote,
          currentSegment: segment,
          createSegment,
          getCachedSegmentIndex,
          setCachedSegmentIndex,
        }}
      >
        {children}
      </MediaShadowProviderContext.Provider>
      <Tooltip className="z-10" id="media-shadow-tooltip" />
    </>
  );
};
