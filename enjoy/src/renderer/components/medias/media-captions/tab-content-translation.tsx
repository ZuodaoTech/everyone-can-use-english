import { useEffect, useState, useContext } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { Button, toast, TabsContent, Separator } from "@renderer/components/ui";
import { t } from "i18next";
import { useAiCommand } from "@renderer/hooks";
import { LoaderIcon } from "lucide-react";
import { md5 } from "js-md5";
import Markdown from "react-markdown";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { convertIpaToNormal } from "@/utils";
import { CamdictLookupResult, AiLookupResult } from "@renderer/components";

/*
 * Translation tab content.
 */
export function TabContentTranslation(props: {
  caption: TimelineEntry;
  selectedIndices: number[];
}) {
  const { caption } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);
  const { translate } = useAiCommand();

  const translateSetence = async () => {
    if (translating) return;

    setTranslating(true);
    translate(caption.text, `translate-${md5(caption.text)}`)
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
    EnjoyApp.cacheObjects
      .get(`translate-${md5(caption.text)}`)
      .then((cached) => {
        setTranslation(cached);
      });
  }, [caption.text]);

  return (
    <TabsContent value="translation">
      <SelectedWords {...props} />

      <Separator />

      {translation ? (
        <div className="py-4">
          <div className="text-sm italic text-muted-foreground mb-2">
            {t("translateSetence")}
          </div>
          <Markdown className="select-text prose dark:prose-invert prose-sm prose-h3:text-base max-w-full mb-2">
            {translation}
          </Markdown>

          <div className="flex items-center">
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
        </div>
      ) : (
        <div className="flex items-center py-4">
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

const SelectedWords = (props: {
  caption: TimelineEntry;
  selectedIndices: number[];
}) => {
  const { selectedIndices, caption } = props;

  const { transcription } = useContext(MediaPlayerProviderContext);

  const word = selectedIndices
    .map((index) => caption.timeline[index]?.text || "")
    .join(" ")
    .trim();

  if (selectedIndices.length === 0)
    return (
      <div className="text-sm text-muted-foreground py-4">
        {t("clickAnyWordToSelect")}
      </div>
    );

  return (
    <>
      <div className="flex flex-wrap items-center space-x-2 select-text mb-4">
        {selectedIndices.map((index, i) => {
          const word = caption.timeline[index];
          if (!word) return;
          return (
            <div key={index}>
              <div className="font-serif text-lg font-semibold tracking-tight">
                {word.text}
              </div>
              {word.timeline.length > 0 && (
                <div className="text-sm text-serif text-muted-foreground">
                  <span
                    className={`mr-2 font-code ${
                      i === 0 ? "before:content-['/']" : ""
                    }
                        ${
                          i === selectedIndices.length - 1
                            ? "after:content-['/']"
                            : ""
                        }`}
                  >
                    {word.timeline
                      .map((t) =>
                        t.timeline
                          .map((s) => convertIpaToNormal(s.text))
                          .join("")
                      )
                      .join("")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Separator className="my-2" />
      <CamdictLookupResult word={word} />

      <Separator className="my-2" />
      <AiLookupResult
        word={word}
        context={caption.text}
        sourceId={transcription.targetId}
        sourceType={transcription.targetType}
      />
    </>
  );
};
