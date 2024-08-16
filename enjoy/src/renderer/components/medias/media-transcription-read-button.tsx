import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ScrollArea,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  toast,
} from "@renderer/components/ui";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { t } from "i18next";
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  GaugeCircleIcon,
  LoaderIcon,
  MicIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
import { useRecordings } from "@renderer/hooks";
import { formatDateTime } from "@renderer/lib/utils";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { Caption, RecordingDetail } from "@renderer/components";
import { LiveAudioVisualizer } from "react-audio-visualize";

const TEN_MINUTES = 60 * 10;
export const MediaTranscriptionReadButton = (props: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<RecordingType>(null);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { media, transcription } = useContext(MediaPlayerProviderContext);
  const [assessing, setAssessing] = useState<RecordingType>();

  const handleDelete = () => {
    if (!deleting) return;

    EnjoyApp.recordings.destroy(deleting.id);
  };

  const handleDownload = (recording: RecordingType) => {
    EnjoyApp.dialog
      .showSaveDialog({
        title: t("download"),
        defaultPath: recording.filename,
        filters: [
          {
            name: "Audio",
            extensions: [recording.filename.split(".").pop()],
          },
        ],
      })
      .then((savePath) => {
        if (!savePath) return;

        toast.promise(
          EnjoyApp.download.start(recording.src, savePath as string),
          {
            loading: t("downloading", { file: recording.filename }),
            success: () => t("downloadedSuccessfully"),
            error: t("downloadFailed"),
            position: "bottom-right",
          }
        );
      })
      .catch((err) => {
        if (err) toast.error(err.message);
      });
  };

  const {
    recordings,
    fetchRecordings,
    loading: loadingRecordings,
    hasMore: hasMoreRecordings,
  } = useRecordings(media, -1);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {props.children ? (
            props.children
          ) : (
            <Button variant="outline" size="sm" className="hidden lg:block">
              {t("readThrough")}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent
          onPointerDownOutside={(event) => event.preventDefault()}
          className="max-w-screen-md xl:max-w-screen-lg h-5/6 flex flex-col p-0"
        >
          <DialogTitle className="hidden">{t("readThrough")}</DialogTitle>
          <ScrollArea className="flex-1 px-6 pt-4">
            <div className="select-text mx-auto w-full max-w-prose">
              <h3 className="font-bold text-xl my-4">{media.name}</h3>
              {open &&
                transcription.result.timeline.map(
                  (sentence: TimelineEntry, index: number) => (
                    <div key={index} className="flex flex-start space-x-2 mb-4">
                      <span className="text-sm text-muted-foreground min-w-max leading-8">
                        #{index + 1}
                      </span>
                      <Caption
                        caption={sentence}
                        currentSegmentIndex={index}
                        displayIpa={true}
                        displayNotes={false}
                      />
                    </div>
                  )
                )}
            </div>
            <div className="mt-12">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="mx-auto w-full max-w-prose px-4 mb-4"
                  id={recording.id}
                >
                  <div className="flex items-center justify-end space-x-2 mb-2">
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(recording.createdAt)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </DropdownMenuTrigger>

                      <DropdownMenuContent>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleDownload(recording)}
                        >
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          <span>{t("download")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => setAssessing(recording)}
                        >
                          <GaugeCircleIcon
                            className={`w-4 h-4 mr-2
                    ${
                      recording.pronunciationAssessment
                        ? recording.pronunciationAssessment
                            .pronunciationScore >= 80
                          ? "text-green-500"
                          : recording.pronunciationAssessment
                              .pronunciationScore >= 60
                          ? "text-yellow-600"
                          : "text-red-500"
                        : ""
                    }
                    `}
                          />
                          <span>{t("pronunciationAssessment")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive cursor-pointer"
                          onClick={() => setDeleting(recording)}
                        >
                          <Trash2Icon className="w-4 h-4 mr-2" />
                          <span>{t("delete")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <MediaPlayer
                    duration={recording.duration / 1000}
                    src={recording.src}
                  >
                    <MediaProvider />
                    <DefaultAudioLayout icons={defaultLayoutIcons} />
                  </MediaPlayer>
                </div>
              ))}
              {hasMoreRecordings && (
                <div className="flex items-center justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => fetchRecordings(recordings.length)}
                  >
                    {loadingRecordings && (
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                    )}
                    <span>{t("loadMore")}</span>
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="h-16 border-t">
            {open && <RecorderButton onRecorded={() => fetchRecordings(0)} />}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(value) => {
          if (value) return;
          setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRecording")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecordingConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleDelete}>{t("delete")}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={Boolean(assessing)}
        onOpenChange={(open) => {
          if (!open) setAssessing(undefined);
        }}
      >
        <SheetContent
          aria-describedby={undefined}
          side="bottom"
          className="rounded-t-2xl shadow-lg max-h-screen overflow-y-scroll"
          displayClose={false}
        >
          <SheetHeader className="flex items-center justify-center -mt-4 mb-2">
            <SheetClose>
              <ChevronDownIcon />
            </SheetClose>
          </SheetHeader>

          {assessing && <RecordingDetail recording={assessing} />}
        </SheetContent>
      </Sheet>
    </>
  );
};

const RecorderButton = (props: { onRecorded: () => void }) => {
  const { onRecorded } = props;
  const {
    media,
    recordingBlob,
    isRecording,
    isPaused,
    togglePauseResume,
    startRecording,
    stopRecording,
    transcription,
    currentSegmentIndex,
    mediaRecorder,
    recordingTime,
  } = useContext(MediaPlayerProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [access, setAccess] = useState<boolean>(false);

  const createRecording = async (blob: Blob) => {
    const currentSegment =
      transcription?.result?.timeline?.[currentSegmentIndex];
    if (!currentSegment) return;

    EnjoyApp.recordings
      .create({
        targetId: media.id,
        targetType: media.mediaType,
        blob: {
          type: recordingBlob.type.split(";")[0],
          arrayBuffer: await blob.arrayBuffer(),
        },
        referenceId: -1,
        referenceText: transcription.result.timeline
          .map((s: TimelineEntry) => s.text)
          .join("\n"),
      })
      .then(() =>
        toast.success(t("recordingSaved"), { position: "bottom-right" })
      )
      .catch((err) =>
        toast.error(t("failedToSaveRecording" + " : " + err.message))
      );
  };

  const askForMediaAccess = () => {
    EnjoyApp.system.preferences.mediaAccess("microphone").then((access) => {
      if (access) {
        setAccess(true);
      } else {
        setAccess(false);
        toast.warning(t("noMicrophoneAccess"));
      }
    });
  };

  useEffect(() => {
    askForMediaAccess();
  }, []);

  useEffect(() => {
    if (!media) return;
    if (!transcription) return;
    if (!recordingBlob) return;

    createRecording(recordingBlob);
  }, [recordingBlob, media, transcription]);

  useEffect(() => {
    if (recordingTime >= TEN_MINUTES) {
      onRecorded();
    }
  }, [recordingTime]);

  if (isRecording) {
    return (
      <div className="h-16 flex items-center justify-center px-6">
        <div className="flex items-center space-x-2">
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            barWidth={2}
            gap={2}
            width={250}
            height={30}
            fftSize={512}
            maxDecibels={-10}
            minDecibels={-80}
            smoothingTimeConstant={0.4}
          />
          <span className="text-sm text-muted-foreground">
            {Math.floor(recordingTime / 60)}:
            {String(recordingTime % 60).padStart(2, "0")}
          </span>
          <Button
            onClick={togglePauseResume}
            className="rounded-full shadow w-8 h-8"
            size="icon"
          >
            {isPaused ? (
              <PlayIcon
                data-tooltip-id="chat-input-tooltip"
                data-tooltip-content={t("continue")}
                fill="white"
                className="w-4 h-4"
              />
            ) : (
              <PauseIcon
                data-tooltip-id="chat-input-tooltip"
                data-tooltip-content={t("pause")}
                fill="white"
                className="w-4 h-4"
              />
            )}
          </Button>
          <Button
            data-tooltip-id="chat-input-tooltip"
            data-tooltip-content={t("finish")}
            onClick={stopRecording}
            className="rounded-full bg-green-500 hover:bg-green-600 shadow w-8 h-8"
            size="icon"
          >
            <CheckIcon className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-16 flex items-center justify-center px-6">
      <Button
        disabled={!access}
        variant="ghost"
        className="aspect-square p-0 h-12 rounded-full bg-red-500 hover:bg-red-500/90"
        onClick={() => startRecording()}
      >
        <MicIcon className="w-6 h-6 text-white" />
      </Button>
    </div>
  );
};
