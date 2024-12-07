import { useContext } from "react";
import { MediaShadowProviderContext } from "@renderer/context";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogFooter,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui";
import { CircleAlertIcon, LoaderIcon } from "lucide-react";
import { t } from "i18next";
import { TranscriptionCreateForm, TranscriptionsList } from "../transcriptions";
import { SttEngineOptionEnum } from "@/types/enums";

export const MediaLoadingModal = () => {
  const { decoded, transcription } = useContext(MediaShadowProviderContext);

  return (
    <AlertDialog open={!decoded || !Boolean(transcription?.result?.timeline)}>
      <AlertDialogContent className="max-h-[70%] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("preparingAudio")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("itMayTakeAWhileToPrepareForTheFirstLoad")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <LoadingContent />
      </AlertDialogContent>
    </AlertDialog>
  );
};

const LoadingContent = () => {
  const {
    media,
    decoded,
    decodeError,
    transcription,
    transcribing,
    transcribingProgress,
    transcribingOutput,
    generateTranscription,
    onCancel,
  } = useContext(MediaShadowProviderContext);
  if (decoded) {
    // Decoded and transcription created but not ready
    if (transcription && !transcription.result?.timeline) {
      return (
        <Tabs defaultValue="transcribe">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="transcribe">{t("transcribe")}</TabsTrigger>
            <TabsTrigger value="download">
              {t("downloadTranscript")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="transcribe">
            <TranscriptionCreateForm
              originalText={transcription?.result?.originalText}
              onSubmit={(data) => {
                generateTranscription({
                  originalText: data.text,
                  language: data.language,
                  service: data.service as SttEngineOptionEnum | "upload",
                  isolate: data.isolate,
                });
              }}
              onCancel={onCancel}
              transcribing={transcribing}
              transcribingProgress={transcribingProgress}
              transcribingOutput={transcribingOutput}
            />
          </TabsContent>
          <TabsContent value="download">
            <TranscriptionsList media={media} transcription={transcription} />
          </TabsContent>
        </Tabs>
      );
    } else {
      return (
        <div className="flex items-center space-x-4">
          <LoaderIcon className="w-4 h-4 animate-spin" />
        </div>
      );
    }
    // Decode error
  } else if (decodeError) {
    return (
      <>
        <div className="mb-4 flex items-center space-x-4">
          <div className="w-4 h-4">
            <CircleAlertIcon className="text-destructive w-4 h-4" />
          </div>
          <div className="select-text">
            <div className="mb-2">{decodeError}</div>
            <div className="text-sm text-muted-foreground">
              {t("failedToDecodeWaveform")}:{" "}
              <span className="break-all ">{media?.src}</span>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </AlertDialogFooter>
      </>
    );
  } else {
    return (
      <>
        <div className="mb-4 flex items-center space-x-4">
          {media?.src ? (
            <>
              <LoaderIcon className="w-4 h-4 animate-spin" />
              <span>{t("decodingWaveform")}</span>
            </>
          ) : (
            <>
              <CircleAlertIcon className="text-destructive w-4 h-4" />
              <span>{t("cannotFindSourceFile")}</span>
            </>
          )}
        </div>
        <AlertDialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </AlertDialogFooter>
      </>
    );
  }
};
