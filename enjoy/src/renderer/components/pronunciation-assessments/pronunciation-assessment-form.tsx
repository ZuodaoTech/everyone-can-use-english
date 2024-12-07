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
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@/renderer/context";
import { LANGUAGES } from "@/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  LoaderIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { usePronunciationAssessments } from "@/renderer/hooks";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { LiveAudioVisualizer } from "react-audio-visualize";

const pronunciationAssessmentSchema = z.object({
  file: z.instanceof(FileList).optional(),
  recordingFile: z.instanceof(Blob).optional(),
  language: z.string().min(2),
  referenceText: z.string().optional(),
});

export const PronunciationAssessmentForm = () => {
  const navigate = useNavigate();
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const [submitting, setSubmitting] = useState(false);
  const { createAssessment } = usePronunciationAssessments();

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
    if ((!data.file || data.file.length === 0) && !data.recordingFile) {
      toast.error(t("noFileOrRecording"));
      form.setError("recordingFile", { message: t("noFileOrRecording") });
      return;
    }
    const { language, referenceText } = data;

    let recording: RecordingType;
    try {
      recording = await createRecording(data);
    } catch (err) {
      toast.error(err.message);
    }
    if (!recording) return;

    setSubmitting(true);
    createAssessment({
      language,
      reference: referenceText,
      recording,
    })
      .then(() => {
        navigate("/pronunciation_assessments");
      })
      .catch((err) => {
        toast.error(err.message);
        EnjoyApp.recordings.destroy(recording.id);
      })
      .finally(() => setSubmitting(false));
  };

  const createRecording = async (
    data: z.infer<typeof pronunciationAssessmentSchema>
  ): Promise<RecordingType> => {
    const { language, referenceText, file, recordingFile } = data;
    let arrayBuffer: ArrayBuffer;
    if (recordingFile) {
      arrayBuffer = await recordingFile.arrayBuffer();
    } else {
      arrayBuffer = await new Blob([file[0]]).arrayBuffer();
    }

    return EnjoyApp.recordings.create({
      language,
      referenceText,
      blob: {
        type: recordingFile?.type || file[0].type,
        arrayBuffer,
      },
    });
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
                        disabled={submitting}
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
                  name="recordingFile"
                  render={({ field }) => (
                    <FormItem className="grid w-full items-center gap-1.5">
                      <Input
                        disabled={submitting}
                        placeholder={t("recording")}
                        type="file"
                        className="hidden"
                        accept="audio/*"
                        {...fileField}
                      />
                      <RecorderButton
                        onStart={() => {
                          form.resetField("recordingFile");
                        }}
                        onFinish={(blob) => {
                          field.onChange(blob);
                        }}
                      />
                    </FormItem>
                  )}
                />
                {form.watch("recordingFile") && (
                  <div className="">
                    <audio controls className="w-full">
                      <source
                        src={URL.createObjectURL(form.watch("recordingFile"))}
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
                  <Select
                    disabled={submitting}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
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
                    disabled={submitting}
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

const RecorderButton = (props: {
  submitting?: boolean;
  onStart?: () => void;
  onFinish: (blob: Blob) => void;
}) => {
  const { submitting, onStart, onFinish } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [access, setAccess] = useState<boolean>(false);
  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  } = useAudioRecorder();

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
    if (recordingBlob) {
      onFinish(recordingBlob);
    }
  }, [recordingBlob]);

  useEffect(() => {
    if (!isRecording) return;

    if (recordingTime >= 60 * 5) {
      stopRecording();
    }
  }, [recordingTime]);

  if (isRecording) {
    return (
      <div className="w-full flex justify-center">
        <div className="flex items-center space-x-2">
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            barWidth={2}
            gap={2}
            width={140}
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
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("continue")}
                fill="white"
                className="w-4 h-4"
              />
            ) : (
              <PauseIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("pause")}
                fill="white"
                className="w-4 h-4"
              />
            )}
          </Button>
          <Button
            data-tooltip-id="global-tooltip"
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
    <div className="w-full flex items-center gap-4 justify-center">
      <Button
        data-tooltip-id="global-tooltip"
        data-tooltip-content={t("record")}
        disabled={submitting}
        onClick={(event) => {
          event.preventDefault();
          onStart && onStart();
          if (access) {
            startRecording();
          } else {
            askForMediaAccess();
          }
        }}
        className="rounded-full shadow w-10 h-10"
        size="icon"
      >
        {submitting ? (
          <LoaderIcon className="w-6 h-6 animate-spin" />
        ) : (
          <MicIcon className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
};
