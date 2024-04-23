import { useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button, toast, TabsContent } from "@renderer/components/ui";
import { t } from "i18next";
import { useAiCommand } from "@renderer/hooks";
import { LoaderIcon } from "lucide-react";
import { md5 } from "js-md5";
import Markdown from "react-markdown";

/*
 * Translation tab content.
 */
export function TabContentTranslation(props: { text: string; }) {
  const { text } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);
  const { translate } = useAiCommand();

  const translateSetence = async () => {
    if (translating) return;

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
   * If the caption is changed, then reset the translation.
   * Also, check if the translation is cached, then use it.
   */
  useEffect(() => {
    EnjoyApp.cacheObjects.get(`translate-${md5(text)}`).then((cached) => {
      setTranslation(cached);
    });
  }, [text]);

  return (
    <TabsContent value="translation">
      {translation ? (
        <>
          <Markdown className="select-text prose dark:prose-invert prose-sm prose-h3:text-base max-w-full mb-4">
            {translation}
          </Markdown>

          <div className="flex items-center justify-end">
            <Button
              variant="secondary"
              size="sm"
              disabled={translating}
              onClick={translateSetence}
            >
              {translating && (
                <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
              )}
              {t("reTranslate")}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            size="sm"
            disabled={translating}
            onClick={() => translateSetence()}
          >
            {translating && (
              <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
            )}
            <span>{t("translateSetence")}</span>
          </Button>
        </div>
      )}
    </TabsContent>
  );
}
