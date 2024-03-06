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
  Button,
  PingPoint,
  Progress,
} from "@renderer/components/ui";
import { CheckCircleIcon, LoaderIcon } from "lucide-react";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";

export const MediaLoadingModal = () => {
  const navigate = useNavigate();
  const { whisperConfig } = useContext(AISettingsProviderContext);
  const {
    decoded,
    transcription,
    transcribing,
    transcribingProgress,
    generateTranscription,
  } = useContext(MediaPlayerProviderContext);

  return (
    <AlertDialog open={!decoded || !Boolean(transcription?.result)}>
      <AlertDialogContent>
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
          ) : transcription.result ? (
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
                  <Button
                    onClick={generateTranscription}
                    className="ml-4"
                    size="sm"
                  >
                    {t("transcribe")}
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
