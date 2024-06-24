import { useContext } from "react";
import {
  MediaPlayerProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogOverlay,
  Button,
  PingPoint,
  Progress,
} from "@renderer/components/ui";
import { CheckCircleIcon, LoaderIcon, XCircleIcon } from "lucide-react";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { TranscriptionCreateForm } from "../transcriptions";

export const MediaLoadingModal = () => {
  const navigate = useNavigate();
  const { whisperConfig } = useContext(AISettingsProviderContext);
  const {
    media,
    decoded,
    decodeError,
    transcription,
    transcribing,
    transcribingProgress,
    generateTranscription,
  } = useContext(MediaPlayerProviderContext);

  return (
    <AlertDialog open={!decoded || !Boolean(transcription?.result?.timeline)}>
      <AlertDialogOverlay className="" />
      <AlertDialogContent className="">
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
            <TranscriptionCreateForm
              onSubmit={(data) => {
                generateTranscription({
                  originalText: data.text,
                  language: data.language,
                  service: data.service as WhisperConfigType["service"],
                });
              }}
              onCancel={() => navigate(-1)}
              transcribing={transcribing}
              transcribingProgress={transcribingProgress}
            />
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
