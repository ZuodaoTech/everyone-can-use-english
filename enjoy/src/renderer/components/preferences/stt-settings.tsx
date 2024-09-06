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
import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { InfoIcon, AlertCircleIcon } from "lucide-react";
import { SttEngineOptionEnum } from "@/types/enums";

export const WhisperSettings = () => {
  const { sttEngine, whisperConfig, refreshWhisperConfig, setSttEngine } =
    useContext(AISettingsProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
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
            <AlertCircleIcon className="ml-2 w-4 h-4 text-yellow-500" />
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {sttEngine === SttEngineOptionEnum.LOCAL &&
            t("localSpeechToTextDescription")}
          {sttEngine === SttEngineOptionEnum.ENJOY_AZURE &&
            t("enjoyAzureSpeechToTextDescription")}
          {sttEngine === SttEngineOptionEnum.ENJOY_CLOUDFLARE &&
            t("enjoyCloudflareSpeechToTextDescription")}
          {sttEngine === SttEngineOptionEnum.OPENAI &&
            t("openaiSpeechToTextDescription")}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Select
          value={sttEngine}
          onValueChange={(value) => {
            setSttEngine(value);
          }}
        >
          <SelectTrigger className="min-w-fit">
            <SelectValue placeholder="service"></SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SttEngineOptionEnum.LOCAL}>
              {t("local")}
            </SelectItem>
            <SelectItem value={SttEngineOptionEnum.ENJOY_AZURE}>
              {t("enjoyAzure")}
            </SelectItem>
            <SelectItem value={SttEngineOptionEnum.ENJOY_CLOUDFLARE}>
              {t("enjoyCloudflare")}
            </SelectItem>
            <SelectItem value={SttEngineOptionEnum.OPENAI}>OpenAI</SelectItem>
          </SelectContent>
        </Select>

        {sttEngine === "local" && (
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
                        EnjoyApp.shell.openPath(whisperConfig?.modelsPath);
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
