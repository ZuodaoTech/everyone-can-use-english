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
import { useState, useContext, useEffect } from "react";
import { DocumentFormats } from "@/constants";
import { AppSettingsProviderContext } from "@renderer/context";
import { useNavigate } from "react-router-dom";
import { Readability } from "@mozilla/readability";
import { Buffer } from "buffer";

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
    if (uri.startsWith("http")) {
      EnjoyApp.view.scrape(uri);
    } else {
      createFromLocalFile(uri, uri);
    }
  };

  const createFromLocalFile = async (path: string, source?: string) => {
    EnjoyApp.documents
      .create({
        uri: path,
        config: {
          autoTranslate: false,
          autoNextSpeech: true,
          tts: {
            engine: "enjoyai",
            model: "openai/tts-1",
            voice: "alloy",
          },
        },
        source,
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

  const onViewState = async (event: {
    state: string;
    url?: string;
    error?: string;
    html?: string;
  }) => {
    const { state, html, error, url } = event;
    if (state === "did-finish-load") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const reader = new Readability(doc);
      const article = reader.parse();

      const file = await EnjoyApp.cacheObjects.writeFile(
        `${doc.title}.html`,
        Buffer.from(article.content)
      );
      createFromLocalFile(file, url);
    } else if (state === "did-fail-load") {
      setSubmitting(false);
      toast.error(error || t("failedToLoadLink"));
    }
  };

  useEffect(() => {
    EnjoyApp.view.onViewState((_event, state) => onViewState(state));

    return () => {
      EnjoyApp.view.removeViewStateListeners();
      EnjoyApp.view.remove();
    };
  }, []);

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
                    name: t("documents"),
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
