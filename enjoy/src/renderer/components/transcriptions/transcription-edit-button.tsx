import { MediaShadowProviderContext } from "@renderer/context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
  toast,
} from "@renderer/components/ui";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { milisecondsToTimestamp } from "@/utils";

export const TranscriptionEditButton = (props: {
  children?: React.ReactNode;
}) => {
  const { media, transcription, generateTranscription } = useContext(
    MediaShadowProviderContext
  );
  const [open, setOpen] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [content, setContent] = useState<string>(
    // generate text in SRT format from timeline entries
    transcription.result.timeline
      .map(
        (t: TimelineEntry, index: number) =>
          `${index + 1}\n${milisecondsToTimestamp(
            t.startTime * 1000
          )} --> ${milisecondsToTimestamp(t.endTime * 1000)}\n${t.text}`
      )
      .join("\n\n")
  );
  const [downloadUrl, setDownloadUrl] = useState<string>();

  const handleSave = async () => {
    setSubmiting(true);
    generateTranscription({ originalText: content, service: "upload" })
      .then(() => setOpen(false))
      .catch((e) => {
        toast.error(e.message);
      })
      .finally(() => setSubmiting(false));
  };

  useEffect(() => {
    if (!content) return;

    const blob = new Blob([content], { type: "text/html" });
    setDownloadUrl(URL.createObjectURL(blob));
  }, [content]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.children ? (
          props.children
        ) : (
          <Button variant="outline" size="sm">
            <span className="capitalize">{t("edit")}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-screen-sm xl:max-w-screen-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("editTranscription")}</DialogTitle>
        </DialogHeader>
        <div>
          <Textarea
            disabled={submiting}
            className="h-96 text-lg font-serif resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={submiting} variant="secondary">
              {t("cancel")}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <a download={`${media.name}.srt`} href={downloadUrl}>
              <Button variant="secondary">{t("download")}</Button>
            </a>
          </DialogClose>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={submiting}>
                {submiting && <LoaderIcon className="animate-spin w-4 mr-2" />}
                {t("save")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("saveTranscription")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("areYouSureToSaveTranscription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submiting}>
                  {t("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button disabled={submiting} onClick={handleSave}>
                    {submiting && (
                      <LoaderIcon className="animate-spin w-4 mr-2" />
                    )}
                    {t("save")}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
