import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { useContext, useEffect, useRef, useState } from "react";
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
import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { t } from "i18next";
import WaveSurfer from "wavesurfer.js";
import {
  ChevronDownIcon,
  DownloadIcon,
  GaugeCircleIcon,
  LoaderIcon,
  MicIcon,
  MoreHorizontalIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import { useRecordings } from "@/renderer/hooks";
import { formatDateTime } from "@/renderer/lib/utils";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { Caption, RecordingDetail } from "@renderer/components";

const TEN_MINUTES = 60 * 10;
let interval: NodeJS.Timeout;

export const MediaTranscriptionReadButton = () => {
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
          <Button variant="outline" size="sm" className="hidden lg:block">
            {t("readThrough")}
          </Button>
        </DialogTrigger>
        <DialogContent
          onPointerDownOutside={(event) => event.preventDefault()}
          className="max-w-screen-md xl:max-w-screen-lg h-5/6 flex flex-col p-0"
        >
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
  const { media, transcription } = useContext(MediaPlayerProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<RecordPlugin>();
  const [access, setAccess] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const ref = useRef(null);

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

  const startRecord = () => {
    if (isRecording) return;
    if (!recorder) {
      toast.warning(t("noMicrophoneAccess"));
      return;
    }

    RecordPlugin.getAvailableAudioDevices()
      .then((devices) => devices.find((d) => d.kind === "audioinput"))
      .then((device) => {
        if (device) {
          recorder.startRecording({ deviceId: device.deviceId });
          setIsRecording(true);
          setDuration(0);
          interval = setInterval(() => {
            setDuration((duration) => {
              if (duration >= TEN_MINUTES) {
                recorder.stopRecording();
              }
              return duration + 0.1;
            });
          }, 100);
        } else {
          toast.error(t("cannotFindMicrophone"));
        }
      });
  };

  const createRecording = async (blob: Blob) => {
    if (!media) return;

    toast.promise(
      EnjoyApp.recordings
        .create({
          targetId: media.id,
          targetType: media.mediaType,
          blob: {
            type: blob.type.split(";")[0],
            arrayBuffer: await blob.arrayBuffer(),
          },
          referenceId: -1,
          referenceText: transcription.result.timeline
            .map((s: TimelineEntry) => s.text)
            .join("\n"),
          duration,
        })
        .then(() => onRecorded()),
      {
        loading: t("savingRecording"),
        success: t("recordingSaved"),
        error: (e) => t("failedToSaveRecording" + " : " + e.message),
        position: "bottom-right",
      }
    );
  };

  useEffect(() => {
    if (!access) return;
    if (!ref?.current) return;

    const ws = WaveSurfer.create({
      container: ref.current,
      fillParent: true,
      height: 40,
      autoCenter: false,
      normalize: false,
    });

    const record = ws.registerPlugin(RecordPlugin.create());
    setRecorder(record);

    record.on("record-end", async (blob: Blob) => {
      if (interval) clearInterval(interval);
      createRecording(blob);
      setIsRecording(false);
    });

    return () => {
      if (interval) clearInterval(interval);
      recorder?.stopRecording();
      ws?.destroy();
    };
  }, [access, ref]);

  useEffect(() => {
    askForMediaAccess();
  }, []);
  return (
    <div className="h-16 flex items-center justify-center px-6">
      <div
        ref={ref}
        className={isRecording ? "w-full mr-4" : "w-0 overflow-hidden"}
      ></div>
      {isRecording && (
        <div className="text-muted-foreground text-sm w-24 mr-4">
          {duration.toFixed(1)} / {TEN_MINUTES}
        </div>
      )}
      <Button
        variant="ghost"
        className="aspect-square p-0 h-12 rounded-full bg-red-500 hover:bg-red-500/90"
        onClick={() => {
          if (isRecording) {
            recorder?.stopRecording();
          } else {
            startRecord();
          }
        }}
      >
        {isRecording ? (
          <SquareIcon fill="white" className="w-6 h-6 text-white" />
        ) : (
          <MicIcon className="w-6 h-6 text-white" />
        )}
      </Button>
    </div>
  );
};
