import { createContext, useEffect, useState, useContext } from "react";
import { extractFrequencies } from "@/utils";
import { AppSettingsProviderContext } from "@renderer/context";
import WaveSurfer from "wavesurfer.js";
import Regions, {
  type Region as RegionType,
} from "wavesurfer.js/dist/plugins/regions";

type WavesurferContextType = {
  media: AudioType | VideoType;
  setMedia: (media: AudioType | VideoType) => void;
  setMediaProvider: (mediaProvider: HTMLAudioElement | null) => void;
  wavesurfer: WaveSurfer;
  setRef: (ref: any) => void;
  initialized: boolean;
  currentTime: number;
  currentSegmentIndex: number;
  setCurrentSegmentIndex: (index: number) => void;
  zoomRatio: number;
};

export const WavesurferContext = createContext<WavesurferContextType>(null);

export const WavesurferProvider = ({
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
  const [ref, setRef] = useState(null);

  // Player state
  const [initialized, setInitialized] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seek, setSeek] = useState<{
    seekTo: number;
    timestamp: number;
  }>();
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [zoomRatio, setZoomRatio] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<"loop" | "single" | "all">("all");
  const [playBackRate, setPlaybackRate] = useState<number>(1);
  const [displayInlineCaption, setDisplayInlineCaption] =
    useState<boolean>(true);

  const initializeWavesurfer = async () => {
    if (!media) return;
    if (!mediaProvider) return;
    if (!ref.current) return;

    const waveform = await EnjoyApp.waveforms.find(media.md5);
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
      setInitialized(true);
    } else {
      ws.loadBlob(blob);
    }

    // Set up region plugin
    setRegions(ws.registerPlugin(Regions.create()));

    setWavesurfer(ws);
  };

  /*
   * Initialize wavesurfer when container ref is available
   * and mediaProvider is available
   */
  useEffect(() => {
    initializeWavesurfer();
  }, [media, ref, mediaProvider]);

  /*
   * When wavesurfer is initialized,
   * set up event listeners for wavesurfer
   * and clean up when component is unmounted
   */
  useEffect(() => {
    if (!wavesurfer) return;

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
      }),
      wavesurfer.on("ready", () => {
        setInitialized(true);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer]);

  /*
   * When regions are available,
   * set up event listeners for regions
   * and clean up when component is unmounted
   */
  useEffect(() => {
    if (!regions) return;

    const subscriptions = [
      wavesurfer.on("finish", () => {
        if (playMode !== "loop") return;

        regions?.getRegions()[0]?.play();
      }),

      regions.on("region-created", (region: RegionType) => {
        region.on("click", () => {
          wavesurfer.play(region.start, region.end);
        });
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  });

  return (
    <WavesurferContext.Provider
      value={{
        media,
        setMedia,
        setMediaProvider,
        wavesurfer,
        setRef,
        initialized,
        currentTime,
        currentSegmentIndex,
        setCurrentSegmentIndex,
        zoomRatio,
      }}
    >
      {children}
    </WavesurferContext.Provider>
  );
};
