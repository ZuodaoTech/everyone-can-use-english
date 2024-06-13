import {
  Button,
  Input,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Select,
  SelectItem,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  toast,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { AppSettingsProviderContext } from "@/renderer/context";
import { LANGUAGES } from "@/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon, MicIcon, SquareIcon } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";

const pronunciationAssessmentSchema = z.object({
  file: z.instanceof(FileList).optional(),
  recording: z.instanceof(Blob).optional(),
  language: z.string().min(2),
  referenceText: z.string().optional(),
});

export const PronunciationAssessmentForm = () => {
  const navigate = useNavigate();
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof pronunciationAssessmentSchema>>({
    resolver: zodResolver(pronunciationAssessmentSchema),
    values: {
      language: learningLanguage,
      referenceText: "",
    },
  });

  const fileField = form.register("file");

  const onSubmit = async (
    data: z.infer<typeof pronunciationAssessmentSchema>
  ) => {
    console.log(data);
    if ((!data.file || data.file.length === 0) && !data.recording) {
      toast.error(t("noFileOrRecording"));
      form.setError("recording", { message: t("noFileOrRecording") });
      return;
    }
    const { language, referenceText, file, recording } = data;
    let arrayBuffer: ArrayBuffer;
    if (recording) {
      arrayBuffer = await recording.arrayBuffer();
    } else {
      arrayBuffer = await new Blob([file[0]]).arrayBuffer();
    }

    setSubmitting(true);
    toast.promise(
      EnjoyApp.pronunciationAssessments
        .create({
          language,
          referenceText,
          blob: {
            type: recording?.type || file[0].type,
            arrayBuffer,
          },
        })
        .then(() => {
          navigate("/pronunciation_assessments");
        })
        .finally(() => setSubmitting(false)),
      {
        loading: t("assessing"),
        success: t("assessedSuccessfully"),
        error: (err) => err.message,
      }
    );
  };

  return (
    <div className="max-w-screen-md mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col"
        >
          <Tabs className="mb-6" defaultValue="record">
            <TabsList className="mb-2">
              <TabsTrigger value="record">{t("record")}</TabsTrigger>
              <TabsTrigger value="upload">{t("upload")}</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="file"
                  render={() => (
                    <FormItem className="grid w-full items-center gap-1.5">
                      <Input
                        placeholder={t("upload")}
                        type="file"
                        className="cursor-pointer"
                        accept="audio/*"
                        {...fileField}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            <TabsContent value="record">
              <div className="grid gap-4 border p-4 rounded-lg">
                <FormField
                  control={form.control}
                  name="recording"
                  render={({ field }) => (
                    <FormItem className="grid w-full items-center gap-1.5">
                      <Input
                        placeholder={t("recording")}
                        type="file"
                        className="hidden"
                        accept="audio/*"
                        {...fileField}
                      />
                      <RecorderButton
                        onStart={() => {
                          form.resetField("recording");
                        }}
                        onFinish={(blob) => {
                          field.onChange(blob);
                        }}
                      />
                    </FormItem>
                  )}
                />
                {form.watch("recording") && (
                  <div className="">
                    <audio controls className="w-full">
                      <source
                        src={URL.createObjectURL(form.watch("recording"))}
                      />
                    </audio>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <div className="mb-6">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="grid w-full items-center gap-1.5">
                  <FormLabel>{t("language")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mb-6">
            <FormField
              control={form.control}
              name="referenceText"
              render={({ field }) => (
                <FormItem className="grid w-full items-center gap-1.5">
                  <FormLabel>{t("referenceText")}</FormLabel>
                  <Textarea
                    placeholder={t("inputReferenceTextOrLeaveItBlank")}
                    className="h-64"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-6">
            <Button
              disabled={submitting || !form.formState.isDirty}
              className="w-full h-12"
              data-testid="conversation-form-submit"
              size="lg"
              type="submit"
            >
              {submitting && <LoaderIcon className="mr-2 animate-spin" />}
              {t("confirm")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

const TEN_MINUTES = 60 * 10;
let interval: NodeJS.Timeout;
const RecorderButton = (props: {
  onStart?: () => void;
  onFinish: (blob: Blob) => void;
}) => {
  const { onStart, onFinish } = props;
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

    onStart();
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
      onFinish(blob);
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
    <div className="w-full">
      <div className="flex items-center justify-center">
        <Button
          type="button"
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
      <div className="w-full flex items-center">
        <div
          ref={ref}
          className={isRecording ? "w-full mr-4" : "h-0 overflow-hidden"}
        ></div>
        {isRecording && (
          <div className="text-muted-foreground text-sm w-24">
            {duration.toFixed(1)} / {TEN_MINUTES}
          </div>
        )}
      </div>
    </div>
  );
};
