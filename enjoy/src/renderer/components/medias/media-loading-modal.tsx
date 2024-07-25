import { useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogOverlay,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui";
import { CheckCircleIcon, LoaderIcon, XCircleIcon } from "lucide-react";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { TranscriptionCreateForm, TranscriptionsList } from "../transcriptions";

export const MediaLoadingModal = () => {
  const navigate = useNavigate();
  const {
    media,
    decoded,
    decodeError,
    transcription,
    transcribing,
    transcribingProgress,
    transcribingOutput,
    generateTranscription,
  } = useContext(MediaPlayerProviderContext);

  return (
    <AlertDialog open={!decoded || !Boolean(transcription?.result?.timeline)}>
      <AlertDialogOverlay />
      <AlertDialogContent className="max-h-[70%] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("preparingAudio")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("itMayTakeAWhileToPrepareForTheFirstLoad")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {decoded ? (
          transcription?.result?.timeline ? (
            <div className="flex items-center space-x-4">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span>{t("transcribedSuccessfully")}</span>
            </div>
          ) : (
            <Tabs defaultValue="transcribe">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="transcribe">{t("transcribe")}</TabsTrigger>
                <TabsTrigger value="download">{t("downloadTranscript")}</TabsTrigger>
              </TabsList>
              <TabsContent value="transcribe">
                <TranscriptionCreateForm
                  originalText={transcription?.result?.originalText}
                  onSubmit={(data) => {
                    generateTranscription({
                      originalText: data.text,
                      language: data.language,
                      service: data.service as WhisperConfigType["service"],
                      isolate: data.isolate,
                    });
                  }}
                  onCancel={() => navigate(-1)}
                  transcribing={transcribing}
                  transcribingProgress={transcribingProgress}
                  transcribingOutput={transcribingOutput}
                />
              </TabsContent>
              <TabsContent value="download">
                <TranscriptionsList
                  media={media}
                  transcription={transcription}
                />
              </TabsContent>
            </Tabs>
          )
        ) : (
          <>
            {decodeError ? (
              <div className="mb-4 flex items-center space-x-4">
                <div className="w-4 h-4">
                  <XCircleIcon className="w-4 h-4 text-destructive" />
                </div>
                <div className="select-text">
                  <div className="mb-2">{decodeError}</div>
                  <div className="text-sm text-muted-foreground">
                    {t("failedToDecodeWaveform")}:{" "}
                    <span className="break-all ">{media?.src}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 flex items-center space-x-4">
                <LoaderIcon className="w-4 h-4 animate-spin" />
                <span>{t("decodingWaveform")}</span>
              </div>
            )}
            <AlertDialogFooter>
              <Button variant="secondary" onClick={() => navigate(-1)}>
                {t("cancel")}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
