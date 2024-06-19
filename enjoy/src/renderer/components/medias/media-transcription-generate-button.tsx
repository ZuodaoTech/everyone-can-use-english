import { useContext, useRef, useState } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
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
} from "@renderer/components/ui";
import { LoaderIcon } from "lucide-react";

export const MediaTranscriptionGenerateButton = (props: {
  children: React.ReactNode;
}) => {
  const { media, generateTranscription, transcribing, transcription } =
    useContext(MediaPlayerProviderContext);

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
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              generateTranscription({
                originalText: "",
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
