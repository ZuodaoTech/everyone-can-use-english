import { t } from "i18next";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogDescription,
  toast,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@renderer/components/ui";
import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useContext, useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { SttEngineOptionEnum } from "@/types/enums";
import { WHISPER_MODELS } from "@/constants";

export const WhisperSettings = () => {
  const { sttEngine, whisperModel, setWhisperModel, setSttEngine } = useContext(
    AISettingsProviderContext
  );
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [stderr, setStderr] = useState("");

  const handleCheck = async () => {
    toast.promise(
      async () => {
        const { success, log } = await EnjoyApp.echogarden.check();
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

        {sttEngine === SttEngineOptionEnum.LOCAL && (
          <>
            <Select
              value={whisperModel}
              onValueChange={(value) => {
                setWhisperModel(value);
              }}
            >
              <SelectTrigger className="min-w-fit">
                <SelectValue placeholder="service"></SelectValue>
              </SelectTrigger>
              <SelectContent>
                {WHISPER_MODELS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCheck} variant="secondary" size="sm">
              {t("check")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
