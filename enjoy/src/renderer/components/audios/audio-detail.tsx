import { useEffect, useState, useContext } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import {
  LoaderSpin,
  RecordingsList,
  PagePlaceholder,
  MediaPlayer,
  MediaTranscription,
} from "@renderer/components";
import { LoaderIcon } from "lucide-react";
import { ScrollArea } from "@renderer/components/ui";

export const AudioDetail = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const [audio, setAudio] = useState<AudioType | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionType>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Player controls
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seek, setSeek] = useState<{
    seekTo: number;
    timestamp: number;
  }>();
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [zoomRatio, setZoomRatio] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playBackRate, setPlaybackRate] = useState<number>(1);
  const [displayInlineCaption, setDisplayInlineCaption] =
    useState<boolean>(true);

  const onTransactionUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model === "Transcription" && action === "update") {
      setTranscription(record);
    }
  };

  useEffect(() => {
    const where = id ? { id } : { md5 };
    EnjoyApp.audios.findOne(where).then((audio) => {
      if (!audio) return;

      setAudio(audio);
    });
  }, [id, md5]);

  useEffect(() => {
    if (!audio) return;

    EnjoyApp.transcriptions
      .findOrCreate({
        targetId: audio.id,
        targetType: "Audio",
      })
      .then((transcription) => {
        setTranscription(transcription);
      });
  }, [audio]);

  useEffect(() => {
    addDblistener(onTransactionUpdate);
    return () => {
      removeDbListener(onTransactionUpdate);
    };
  }, [transcription]);

  if (!audio) {
    return <LoaderSpin />;
  }

  if (!audio.src) {
    return (
      <PagePlaceholder placeholder="invalid" extra="cannot find play source" />
    );
  }

  return (
    <div className="relative">
      <div className={`grid grid-cols-7 gap-4 ${initialized ? "" : "blur-sm"}`}>
        <div className="col-span-5 h-[calc(100vh-6.5rem)] flex flex-col">
          <MediaPlayer
            mediaId={audio.id}
            mediaType="Audio"
            mediaUrl={audio.src}
            waveformCacheKey={`waveform-audio-${audio.md5}`}
            transcription={transcription}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            currentSegmentIndex={currentSegmentIndex}
            setCurrentSegmentIndex={setCurrentSegmentIndex}
            recordButtonVisible={true}
            seek={seek}
            initialized={initialized}
            setInitialized={setInitialized}
            zoomRatio={zoomRatio}
            setZoomRatio={setZoomRatio}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            isLooping={isLooping}
            setIsLooping={setIsLooping}
            playBackRate={playBackRate}
            setPlaybackRate={setPlaybackRate}
            displayInlineCaption={displayInlineCaption}
            setDisplayInlineCaption={setDisplayInlineCaption}
          />

          <ScrollArea className={`flex-1 relative bg-muted`}>
            <RecordingsList
              key={`recordings-list-${audio.id}-${currentSegmentIndex}`}
              targetId={audio.id}
              targetType="Audio"
              referenceText={transcription?.result?.[currentSegmentIndex]?.text}
              referenceId={currentSegmentIndex}
            />
          </ScrollArea>
        </div>

        <div className="col-span-2 h-[calc(100vh-6.5rem)]">
          <MediaTranscription
            mediaId={audio.id}
            mediaType="Audio"
            mediaName={audio.name}
            transcription={transcription}
            currentSegmentIndex={currentSegmentIndex}
            onSelectSegment={(index) => {
              if (currentSegmentIndex === index) return;

              const segment = transcription?.result?.[index];
              if (!segment) return;

              if (isLooping && isPlaying) setIsPlaying(false);
              setSeek({
                seekTo: segment.offsets.from / 1000,
                timestamp: Date.now(),
              });
            }}
          />
        </div>
      </div>

      {!initialized && (
        <div className="top-0 w-full h-full absolute z-30 bg-white/10 flex items-center justify-center">
          <LoaderIcon className="text-muted-foreground animate-spin w-8 h-8" />
        </div>
      )}
    </div>
  );
};
