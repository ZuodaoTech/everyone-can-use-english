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
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  Button,
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";

export const VideoDetail = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);

  const [video, setVideo] = useState<VideoType | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionType>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);

  // Player controls
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seek, setSeek] = useState<{
    seekTo: number;
    timestamp: number;
  }>();
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [recordButtonVisible, setRecordButtonVisible] =
    useState<boolean>(false);
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

  const handleShare = async () => {
    if (!video.source.startsWith("http")) {
      toast.error(t("shareFailed"), {
        description: t("cannotShareLocalVideo"),
      });
      return;
    }

    if (!video.source && !video.isUploaded) {
      try {
        await EnjoyApp.videos.upload(video.id);
      } catch (err) {
        toast.error(t("shareFailed"), { description: err.message });
        return;
      }
    }

    webApi
      .createPost({
        targetType: "Video",
        targetId: video.id,
      })
      .then(() => {
        toast.success(t("sharedSuccessfully"), {
          description: t("sharedVideo"),
        });
      })
      .catch((err) => {
        toast.error(t("shareFailed"), { description: err.message });
      });
    setSharing(false);
  };

  useEffect(() => {
    const where = id ? { id } : { md5 };
    EnjoyApp.videos.findOne(where).then((video) => {
      if (video) {
        setVideo(video);
      } else {
        toast.error(t("models.video.notFound"));
      }
    });
  }, [id, md5]);

  useEffect(() => {
    if (!video) return;

    EnjoyApp.transcriptions
      .findOrCreate({
        targetId: video.id,
        targetType: "Video",
      })
      .then((transcription) => {
        setTranscription(transcription);
      });
  }, [video]);

  useEffect(() => {
    addDblistener(onTransactionUpdate);
    return () => {
      removeDbListener(onTransactionUpdate);
    };
  }, [transcription]);

  if (!video) {
    return <LoaderSpin />;
  }

  if (!video.src) {
    return (
      <PagePlaceholder placeholder="invalid" extra="cannot find play source" />
    );
  }

  return (
    <div className="relative">
      <div className={`grid grid-cols-7 gap-4 ${initialized ? "" : "blur-sm"}`}>
        <div className="col-span-5 h-[calc(100vh-6.5rem)] flex flex-col">
          <MediaPlayer
            mediaId={video.id}
            mediaType="Video"
            mediaUrl={video.src}
            mediaMd5={video.md5}
            transcription={transcription}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            currentSegmentIndex={currentSegmentIndex}
            setCurrentSegmentIndex={setCurrentSegmentIndex}
            recordButtonVisible={recordButtonVisible}
            setRecordButtonVisible={setRecordButtonVisible}
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
            onShare={() => setSharing(true)}
          />

          <ScrollArea
            className={`flex-1 relative ${
              recordButtonVisible ? "bg-muted" : "hidden"
            }`}
          >
            <RecordingsList
              key={`recordings-list-${video.id}-${currentSegmentIndex}`}
              targetId={video.id}
              targetType="Video"
              referenceText={transcription?.result?.[currentSegmentIndex]?.text}
              referenceId={currentSegmentIndex}
            />
          </ScrollArea>
        </div>

        <div className="col-span-2 h-[calc(100vh-6.5rem)]">
          <MediaTranscription
            mediaId={video.id}
            mediaType="Video"
            mediaUrl={video.src}
            mediaName={video.name}
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

      <AlertDialog open={sharing} onOpenChange={(value) => setSharing(value)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shareAudio")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureToShareThisAudioToCommunity")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <Button variant="default" onClick={handleShare}>
              {t("share")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!initialized && (
        <div className="top-0 w-full h-full absolute z-30 bg-background/10 flex items-center justify-center">
          <LoaderIcon className="text-muted-foreground animate-spin w-8 h-8" />
        </div>
      )}
    </div>
  );
};
