import { useContext, useState } from "react";
import { MediaShadowProviderContext } from "@renderer/context";
import { t } from "i18next";
import {
  Button,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@renderer/components/ui";
import { LoaderIcon } from "lucide-react";
import {
  TranscriptionCreateForm,
  TranscriptionsList,
} from "@renderer/components";
import { SttEngineOptionEnum } from "@/types/enums";

export const MediaTranscriptionGenerateButton = (props: {
  children: React.ReactNode;
}) => {
  const {
    media,
    generateTranscription,
    transcribing,
    transcription,
    transcribingProgress,
    transcribingOutput,
  } = useContext(MediaShadowProviderContext);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
      <AlertDialogContent className="max-h-[70%] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("transcribe")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("transcribeMediaConfirmation", {
              name: media.name,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Tabs defaultValue="transcribe">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="transcribe">{t("transcribe")}</TabsTrigger>
            <TabsTrigger value="download">
              {t("downloadTranscript")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="transcribe">
            <TranscriptionCreateForm
              onCancel={() => setOpen(false)}
              onSubmit={(data) => {
                generateTranscription({
                  originalText: data.text,
                  language: data.language,
                  service: data.service as SttEngineOptionEnum | "upload",
                  isolate: data.isolate,
                })
                  .then(() => {
                    setOpen(false);
                  })
                  .catch((e) => {
                    toast.error(e.message);
                  });
              }}
              originalText=""
              transcribing={transcribing}
              transcribingProgress={transcribingProgress}
              transcribingOutput={transcribingOutput}
            />
          </TabsContent>
          <TabsContent value="download">
            <TranscriptionsList
              media={media}
              transcription={transcription}
              onFinish={() => setOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </AlertDialogContent>
    </AlertDialog>
  );
};
