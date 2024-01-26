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
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@renderer/components/ui";
import { WhisperModelOptions } from "@renderer/components";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { InfoIcon, AlertCircleIcon } from "lucide-react";

export const WhisperSettings = () => {
  const { whisperConfig, refreshWhisperConfig, EnjoyApp, setWhisperService } =
    useContext(AppSettingsProviderContext);
  const [stderr, setStderr] = useState("");

  useEffect(() => {
    refreshWhisperConfig();
  }, []);

  const handleCheck = async () => {
    toast.promise(
      async () => {
        const { success, log } = await EnjoyApp.whisper.check();
        if (success) {
          setStderr("");
          return Promise.resolve();
        } else {
          setStderr(log);
          return Promise.reject();
        }
      },
      {
        loading: t("checkingWhisper"),
        success: t("whisperIsWorkingGood"),
        error: t("whisperIsNotWorking"),
      }
    );
  };

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="flex items-center mb-2">
          <span>{t("sttAiService")}</span>
          {stderr && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                EnjoyApp.app.createIssue("Whisper is not working", stderr);
              }}
            >
              <AlertCircleIcon className="w-4 h-4 text-yellow-500" />
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {whisperConfig?.service === "local" &&
            t("localSpeechToTextDescription")}
          {whisperConfig?.service === "azure" &&
            t("azureSpeechToTextDescription")}
          {whisperConfig?.service === "cloudflare" &&
            t("cloudflareSpeechToTextDescription")}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Select
          value={whisperConfig.service}
          onValueChange={(value) => {
            setWhisperService(value);
          }}
        >
          <SelectTrigger className="min-w-fit">
            <SelectValue placeholder="service"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="local">{t("local")}</SelectItem>
            <SelectItem value="azure">{t("azureAi")}</SelectItem>
            <SelectItem value="cloudflare">{t("cloudflareAi")}</SelectItem>
          </SelectContent>
        </Select>

        {whisperConfig.service === "local" && (
          <>
            <Button onClick={handleCheck} variant="secondary" size="sm">
              {t("check")}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  {t("model")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>{t("sttAiService")}</DialogHeader>
                <DialogDescription>
                  {t("chooseAIModelDependingOnYourHardware")}
                </DialogDescription>

                <WhisperModelOptions />

                <DialogFooter>
                  <div className="text-xs flex items-start space-x-2">
                    <InfoIcon className="mr-1.5 w-4 h-4" />
                    <span className="flex-1 opacity-70">
                      {t("yourModelsWillBeDownloadedTo", {
                        path: whisperConfig.modelsPath,
                      })}
                    </span>
                    <Button
                      onClick={() => {
                        EnjoyApp.shell.openPath(whisperConfig.modelsPath);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      {t("open")}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};
