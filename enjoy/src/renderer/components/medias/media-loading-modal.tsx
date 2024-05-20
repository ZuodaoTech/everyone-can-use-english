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
      <AlertDialogContent className="z-[100]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("preparingAudio")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("itMayTakeAWhileToPrepareForTheFirstLoad")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          {decoded ? (
            <div className="mb-4 flex items-center space-x-4">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span>{t("waveformIsDecoded")}</span>
            </div>
          ) : decodeError ? (
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

          {!transcription ? (
            <div className="flex items-center space-x-4">
              <LoaderIcon className="w-4 h-4 animate-spin" />
              <span>{t("loadingTranscription")}</span>
            </div>
          ) : transcription.result?.timeline ? (
            <div className="flex items-center space-x-4">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span>{t("transcribedSuccessfully")}</span>
            </div>
          ) : transcribing ? (
            <div className="">
              <div className="flex items-center space-x-4 mb-2">
                <PingPoint colorClassName="bg-yellow-500" />
                <span>{t("transcribing")}</span>
              </div>
              {whisperConfig.service === "local" && (
                <Progress value={transcribingProgress} />
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <PingPoint colorClassName="bg-muted" />
              <div className="inline">
                <span>{t("notTranscribedYet")}</span>
                {decoded && (
                  <Button asChild className="ml-4" size="sm">
                    <a
                      className="cursor-pointer"
                      onClick={() =>
                        generateTranscription({
                          originalText: "",
                        })
                      }
                    >
                      {t("regenerate")}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t("cancel")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
