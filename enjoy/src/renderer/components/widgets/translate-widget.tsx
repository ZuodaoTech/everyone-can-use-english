import { useEffect, useContext, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
  ScrollArea,
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
    position?: {
      top: number;
      left: number;
    };
  }>();

  const handleSelectionChanged = (position: { top: number; left: number }) => {
    const selection = document.getSelection();
    if (!selection?.anchorNode?.parentElement) return;

    const text = selection.toString().trim();
    if (!text) return;

    setSelected({ text, position });
    setOpen(true);
  };

  useEffect(() => {
    EnjoyApp.onLookup((_event, _selection, coodinate) => {
      handleSelectionChanged({ top: coodinate.y, left: coodinate.x });
    });

    return () => EnjoyApp.offLookup();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor
        className="absolute w-0 h-0"
        style={{
          top: selected?.position?.top,
          left: selected?.position?.left,
        }}
      ></PopoverAnchor>
      <PopoverContent
        className="w-full p-0 z-50"
        updatePositionStrategy="always"
      >
        <ScrollArea className="py-2 w-96 h-96 relative">
          <div className="px-4 pb-2 mb-2 font-bold text-lg sticky top-0 bg-background border-b">
            {selected?.text}
          </div>
          <TranslateResult text={selected?.text} />
          <div className="px-4"></div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export const TranslateResult = (props: { text: string }) => {
  const { text } = props;
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
      setTranslation(cached);
    });
  }, [text]);

  if (!text) return null;

  return (
    <>
      {translation ? (
        <div className="py-2 select-text">
          <div className="text-serif mb-4">{translation}</div>

          <div className="flex items-center">
            <Button
              variant="secondary"
              size="sm"
              disabled={translating}
              onClick={handleTranslate}
            >
              {translating && (
                <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
              )}
              {t("reTranslate")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center py-2">
          <Button size="sm" disabled={translating} onClick={handleTranslate}>
            {translating && (
              <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
            )}
            <span>{t("translate")}</span>
          </Button>
        </div>
      )}
    </>
  );
};
