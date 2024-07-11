import { useEffect, useContext, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
  toast,
} from "@renderer/components/ui";
import { useAiCommand } from "@renderer/hooks";
import { LoaderIcon } from "lucide-react";
import { t } from "i18next";
import { md5 } from "js-md5";

export const TranslateWidget = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    text: string;
    position: {
      x: number;
      y: number;
    };
  }>();

  const handleSelectionChanged = (position: { x: number; y: number }) => {
    const selection = document.getSelection();
    if (!selection?.anchorNode?.parentElement) return;

    const text = selection.toString().trim();
    if (!text) return;

    // if text is a single word, then return
    if (text.indexOf(" ") === -1) return;

    setSelected({ text, position });
    setOpen(true);
  };

  useEffect(() => {
    EnjoyApp.onTranslate((_event, _selection, position) => {
      handleSelectionChanged(position);
    });

    return () => EnjoyApp.offLookup();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor
        className="absolute w-0 h-0"
        style={{
          top: selected?.position?.y,
          left: selected?.position?.x,
        }}
      ></PopoverAnchor>
      <PopoverContent
        className="w-full p-0 z-50 select-text"
        updatePositionStrategy="always"
      >
        <div className="py-2 w-96 min-h-36 max-h-96 overflow-y-auto relative">
          <div className="px-4 pb-2 mb-2 sticky top-0 bg-background border-b">
            {selected?.text}
          </div>
          <div className="px-4">
            <TranslateResult text={selected?.text} autoTranslate={true} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const TranslateResult = (props: {
  text: string;
  autoTranslate?: boolean;
}) => {
  const { text, autoTranslate = false } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);
  const { translate } = useAiCommand();

  const handleTranslate = async () => {
    if (translating) return;
    if (!text) return;

    setTranslating(true);
    translate(text, `translate-${md5(text)}`)
      .then((result) => {
        if (result) {
          setTranslation(result);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => {
        setTranslating(false);
      });
  };

  /*
   * check if the translation is cached, then use it.
   */
  useEffect(() => {
    if (!text) return;

    EnjoyApp.cacheObjects.get(`translate-${md5(text)}`).then((cached) => {
      if (cached) {
        setTranslation(cached);
      } else if (autoTranslate) {
        handleTranslate();
      } else {
        setTranslation(undefined);
      }
    });
  }, [text, autoTranslate]);

  if (!text) return null;

  return (
    <>
      {translation ? (
        <div className="py-2 select-text">
          <div className="text-serif mb-4">{translation}</div>

          <div className="flex items-center">
            <Button
              className="cursor-pointer"
              variant="secondary"
              size="sm"
              disabled={translating}
              onClick={handleTranslate}
              asChild
            >
              <a>
                {translating && (
                  <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
                )}
                {t("reTranslate")}
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center py-2">
          <Button
            className="cursor-pointer"
            size="sm"
            disabled={translating}
            onClick={handleTranslate}
            asChild
          >
            <a>
              {translating && (
                <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
              )}
              <span>{t("aiTranslate")}</span>
            </a>
          </Button>
        </div>
      )}
    </>
  );
};
