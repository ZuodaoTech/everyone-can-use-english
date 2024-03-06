import { createContext, useEffect, useState, useContext } from "react";
import { extractFrequencies, PitchContour } from "@renderer/components";
import { AppSettingsProviderContext } from "@renderer/context";
import { useTranscriptions, useRecordings } from "@renderer/hooks";
import WaveSurfer from "wavesurfer.js";
import Regions, {
  type Region as RegionType,
} from "wavesurfer.js/dist/plugins/regions";

type MediaPlayerContextType = {
  media: AudioType | VideoType;
  setMedia: (media: AudioType | VideoType) => void;
  setMediaProvider: (mediaProvider: HTMLAudioElement | null) => void;
  wavesurfer: WaveSurfer;
  setRef: (ref: any) => void;
  decoded: boolean;
  currentTime: number;
  currentSegmentIndex: number;
  setCurrentSegmentIndex: (index: number) => void;
  zoomRatio: number;
  waveform: WaveFormDataType;
  regions: Regions | null;
  // Transcription
  transcription: TranscriptionType;
  generateTranscription: () => void;
  transcribing: boolean;
  transcribingProgress: number;
  // Recordings
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
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const [media, setMedia] = useState<AudioType | VideoType>(null);
  const [mediaProvider, setMediaProvider] = useState<HTMLAudioElement | null>(
    null
  );
  const [wavesurfer, setWavesurfer] = useState(null);
  const [regions, setRegions] = useState<Regions | null>(null);
  const [waveform, setWaveForm] = useState<WaveFormDataType>(null);
  const [ref, setRef] = useState(null);

  // Player state
  const [decoded, setDecoded] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [zoomRatio, setZoomRatio] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

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
      waveColor: "#eee",
      progressColor: "rgba(0, 0, 0, 0.15)",
      cursorColor: "#aaa",
      barWidth: 2,
      autoScroll: true,
      minPxPerSec: 150,
      autoCenter: false,
      dragToSeek: false,
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
    setIsPlaying(false);

    const subscriptions = [
      wavesurfer.on("play", () => setIsPlaying(true)),
      wavesurfer.on("pause", () => setIsPlaying(false)),
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
        zoomRatio,
        waveform,
        transcription,
        regions,
        generateTranscription,
        transcribing,
        transcribingProgress,
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
