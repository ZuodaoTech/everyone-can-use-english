import { useContext, useRef, useState } from "react";
import {
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
} from "@renderer/components/ui";
import { LoaderIcon } from "lucide-react";
import { LANGUAGES } from "@/constants";

export const MediaTranscriptionGenerateButton = (props: {
  children: React.ReactNode;
}) => {
  const { media, generateTranscription, transcribing, transcription } =
    useContext(MediaPlayerProviderContext);
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const [language, setLanguage] = useState(learningLanguage);

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
        <div className="mb-4">
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
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              generateTranscription({
                originalText: "",
                language,
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
