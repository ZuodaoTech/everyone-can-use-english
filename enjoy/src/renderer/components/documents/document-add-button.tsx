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
  toast,
} from "@renderer/components/ui";
import { PlusCircleIcon, LoaderIcon } from "lucide-react";
import { t } from "i18next";
import { useState, useContext } from "react";
import { DocumentFormats } from "@/constants";
import { AppSettingsProviderContext } from "@renderer/context";
import { useNavigate } from "react-router-dom";

export const DocumentAddButton = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const navigate = useNavigate();
  const [uri, setUri] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

    EnjoyApp.documents
      .create({
        uri,
        config: {
          autoTranslate: false,
          autoNextSpeech: true,
          tts: {
            engine: "enjoyai",
            model: "openai/tts-1",
            voice: "alloy",
          },
        },
      })
      .then((doc) => {
        navigate(`/documents/${doc.id}`);
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
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

        <div className="flex space-x-2">
          <Input
            placeholder="https://"
            value={uri}
            disabled={submitting}
            onChange={(element) => {
              setUri(element.target.value);
            }}
          />
          <Button
            variant="secondary"
            className="capitalize min-w-max"
            disabled={submitting}
            onClick={async () => {
              const selected = await EnjoyApp.dialog.showOpenDialog({
                properties: ["openFile"],
                filters: [
                  {
                    name: "documents",
                    extensions: DocumentFormats,
                  },
                ],
              });
              if (selected) {
                setUri(selected[0]);
              }
            }}
          >
            {t("localFile")}
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            disabled={submitting}
            onClick={() => {
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
