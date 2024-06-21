import { useContext, useState } from "react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import {
  Button,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
  Label,
  Input,
} from "@renderer/components/ui";
import { LoaderIcon } from "lucide-react";
import { LANGUAGES } from "@/constants";

export const MediaTranscriptionGenerateButton = (props: {
  children: React.ReactNode;
}) => {
  const { media, generateTranscription, transcribing, transcription } =
    useContext(MediaPlayerProviderContext);
  const { whisperConfig } = useContext(AISettingsProviderContext);
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const [language, setLanguage] = useState(learningLanguage);
  const [text, setText] = useState("");
  const [service, setService] = useState<WhisperConfigType["service"]>(
    whisperConfig.service
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger disabled={transcribing} asChild>
        {props.children ? (
          props.children
        ) : (
          <Button
            disabled={transcribing}
            variant="outline"
            className="min-w-max"
          >
            {(transcribing || transcription.state === "processing") && (
              <LoaderIcon className="animate-spin w-4 mr-2" />
            )}
            <span>
              {transcription.result ? t("regenerate") : t("transcribe")}
            </span>
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("transcribe")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("transcribeMediaConfirmation", {
              name: media.name,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="">
          <div className="mb-2">
            <Label>{t("sttAiService")}</Label>
            <Select
              value={service}
              onValueChange={(value) =>
                setService(value as WhisperConfigType["service"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">{t("local")}</SelectItem>
                <SelectItem value="azure">{t("azureAi")}</SelectItem>
                <SelectItem value="cloudflare">{t("cloudflareAi")}</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-2">
            <Label>{t("language")}</Label>
            <Select value={language} onValueChange={setLanguage}>
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
          </div>
          <div className="">
            <Label>
              {t("transcript")}
              {t("optinal")}
            </Label>
            <Input
              className="mb-2"
              type="file"
              accept=".txt,.srt,.vtt"
              onChange={(event) => {
                const file = event.target.files[0];

                if (file) {
                  if (file.type !== "text/plain") {
                    return alert(t("onlyTextFileSupported"));
                  }
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setText(e.target.result as string);
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <div className="text-sm text-muted-foreground">
              {t("uploadTranscriptFile")}
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              generateTranscription({
                originalText: text,
                language,
                service,
              })
            }
          >
            {t("transcribe")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
