import { t } from "i18next";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  toast,
} from "@renderer/components/ui";
import { WhisperModelOptions } from "@renderer/components";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect } from "react";
import { InfoIcon } from "lucide-react";

export const WhisperSettings = () => {
  const { whisperConfig, refreshWhisperConfig, EnjoyApp } = useContext(
    AppSettingsProviderContext
  );

  useEffect(() => {
    refreshWhisperConfig();
  }, []);

  const handleCheck = async () => {
    toast.promise(EnjoyApp.whisper.check(), {
      loading: t("checkingWhisper"),
      success: t("whisperIsWorkingGood"),
      error: t("whisperIsNotWorking"),
    });
  };

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("sttAiModel")}</div>
        <div className="text-sm text-muted-foreground">
          {whisperConfig.model}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button onClick={handleCheck} variant="secondary" size="sm">
          {t("check")}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              {t("edit")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>{t("sttAiModel")}</DialogHeader>
            <DialogDescription>
              {t("chooseAIModelDependingOnYourHardware")}
            </DialogDescription>

            <WhisperModelOptions />

            <DialogFooter>
              <div className="text-xs opacity-70 flex items-start">
                <InfoIcon className="mr-1.5 w-4 h-4" />
                <span className="flex-1">
                  {t("yourModelsWillBeDownloadedTo", {
                    path: whisperConfig.modelsPath,
                  })}
                </span>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
