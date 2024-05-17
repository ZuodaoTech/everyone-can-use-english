import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { t } from "i18next";
import WaveSurfer from "wavesurfer.js";
import { LoaderIcon, MicIcon, SquareIcon } from "lucide-react";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import { useRecordings } from "@/renderer/hooks";
import { formatDateTime } from "@/renderer/lib/utils";

const TEN_MINUTES = 60 * 10;
let interval: NodeJS.Timeout;

export const MediaTranscriptionReadButton = () => {
  const [open, setOpen] = useState(false);
  const { media, transcription } = useContext(MediaPlayerProviderContext);

  const {
    recordings,
    fetchRecordings,
    loading: loadingRecordings,
    hasMore: hasMoreRecordings,
  } = useRecordings(media, -1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden lg:block">
          {t("readThrough")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-screen-md xl:max-w-screen-lg h-5/6 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6 pt-4">
          <div className="select-text mx-auto prose xl:prose-lg dark:prose-revert">
            <h3>{media.name}</h3>
            {transcription.result.timeline.map((sentence: TimelineEntry) => (
              <p>{sentence.text}</p>
            ))}
          </div>
          <div className="mt-12">
            {recordings.map((recording) => (
              <div className="w-full mb-4" id={recording.id}>
                <div className="text-sm text-muted-foreground mb-2 text-right">
                  {formatDateTime(recording.createdAt)}
                </div>
                <audio className="w-full" controls>
                  <source src={recording.src} type="audio/wav" />
                </audio>
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
        <div className="h-16">
          {open && <RecorderButton onRecorded={() => fetchRecordings(0)} />}
        </div>
      </DialogContent>
    </Dialog>
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
      async () => {
        return EnjoyApp.recordings
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
          .then(() => onRecorded());
      },
      {
        loading: t("savingRecording"),
        success: t("recordingSaved"),
        error: (e) => t("failedToSaveRecording" + " : " + e.message),
        position: "bottom-right",
      }
    );
  };

  useEffect(() => {
    console.log(access, ref?.current);
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
