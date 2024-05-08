import { MediaPlayerProviderContext } from "@renderer/context";
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
import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { t } from "i18next";
import { useContext, useState } from "react";
import { LoaderIcon } from "lucide-react";

export const MediaTranscriptionForm = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="capitalize">{t("edit")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-screen-sm xl:max-w-screen-md">
        <TranscriptionForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
};

export const TranscriptionForm = (props: {
  setOpen: (value: boolean) => void;
}) => {
  const { setOpen } = props;
  const [saving, setSaving] = useState(false);
  const { transcription, generateTranscription } = useContext(
    MediaPlayerProviderContext
  );
  const [content, setContent] = useState<string>(
    transcription.result.timeline.map((t: TimelineEntry) => t.text).join("\n\n")
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await generateTranscription(content);
      setOpen(false);
    } catch (e) {
      toast.error(e.message);
    }

    setSaving(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("editTranscription")}</DialogTitle>
      </DialogHeader>
      <div>
        <Textarea
          className="h-96 text-lg font-serif resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">{t("cancel")}</Button>
        </DialogClose>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>{t("save")}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("saveTranscription")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("areYouSureToSaveTranscriptionAndMakeAlignment")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction disabled={saving} onClick={handleSave}>
                {saving && <LoaderIcon className="animate-spin w-4 mr-2" />}
                {t("save")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogFooter>
    </>
  );
};
