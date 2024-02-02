import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Button,
} from "@renderer/components/ui";
import { PlusCircleIcon, LoaderIcon } from "lucide-react";
import { t } from "i18next";
import { useState, useContext } from "react";
import { AudioFormats, VideoFormats } from "@/constants";
import { AppSettingsProviderContext } from "@renderer/context";

export const AddMediaButton = () => {
  const [uri, setUri] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const handleOpen = (value: boolean) => {
    if (submitting) {
      setOpen(true);
    } else {
      setOpen(value);
    }
  };

  const handleSubmit = async () => {
    if (!uri) return;
    setSubmitting(true);

    EnjoyApp.audios.create(uri).finally(() => {
      setSubmitting(false);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="capitalize">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {t("addResource")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addResource")}</DialogTitle>
          <DialogDescription>
            {t("addResourceFromUrlOrLocal")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex space-x-2 mb-6">
          <Input
            placeholder="https://"
            value={uri}
            onChange={(element) => {
              setUri(element.target.value);
            }}
          />
          <Button
            variant="secondary"
            className="capitalize min-w-max"
            onClick={async () => {
              const files = await EnjoyApp.dialog.showOpenDialog({
                properties: ["openFile"],
                filters: [
                  {
                    name: "audio,video",
                    extensions: [...AudioFormats, ...VideoFormats],
                  },
                ],
              });
              if (files) {
                setUri(files[0]);
              }
            }}
          >
            {t("localFile")}
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setSubmitting(false);
              setOpen(false);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="default"
            disabled={!uri || submitting}
            onClick={handleSubmit}
          >
            {submitting && <LoaderIcon className="animate-spin w-4 mr-2" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
