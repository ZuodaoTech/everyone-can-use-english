import { useEffect, useState, useContext } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { Button, toast, TabsContent, Separator } from "@renderer/components/ui";
import { t } from "i18next";
import { useAiCommand, useCamdict } from "@renderer/hooks";
import { LoaderIcon, Volume2Icon } from "lucide-react";
import { md5 } from "js-md5";
import Markdown from "react-markdown";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { convertIpaToNormal } from "@/utils";

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
  const { webApi } = useContext(AppSettingsProviderContext);

  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<LookupType>();

  const lookup = () => {
    if (selectedIndices.length === 0) return;

    const word = selectedIndices
      .map((index) => caption.timeline[index]?.text || "")
      .join(" ");
    if (!word) return;

    setLookingUp(true);
    lookupWord({
      word,
      context: caption.text,
      sourceId: transcription.targetId,
      sourceType: transcription.targetType,
    })
      .then((res) => {
        if (res?.meaning) {
          setLookupResult(res);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLookingUp(false);
      });
  };

  const { lookupWord } = useAiCommand();
  const { result: camdictResult } = useCamdict(
    selectedIndices
      .map((index) => caption?.timeline?.[index]?.text || "")
      .join(" ")
      .trim()
  );

  /*
   * If the selected indices are changed, then reset the lookup result.
   */
  useEffect(() => {
    if (!caption) return;
    if (!selectedIndices) return;

    const word = selectedIndices
      .map((index) => caption.timeline[index]?.text || "")
      .join(" ");

    if (!word) return;

    webApi
      .lookup({
        word,
        context: caption.text,
        sourceId: transcription.targetId,
        sourceType: transcription.targetType,
      })
      .then((res) => {
        if (res?.meaning) {
          setLookupResult(res);
        } else {
          setLookupResult(null);
        }
      });
  }, [caption, selectedIndices]);

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

      {camdictResult && (
        <>
          <Separator className="my-2" />
          <div className="text-sm italic text-muted-foreground mb-2">
            {t("cambridgeDictionary")}
          </div>
          <div className="select-text">
            {camdictResult.posItems.map((posItem, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center space-x-4 mb-2 flex-wrap">
                  <div className="italic text-sm text-muted-foreground">
                    {posItem.type}
                  </div>

                  {posItem.pronunciations.map((pron, i) => (
                    <div
                      key={`pron-${i}`}
                      className="flex items-center space-x-2"
                    >
                      <span className="uppercase text-xs font-serif text-muted-foreground">
                        [{pron.region}]
                      </span>
                      <span className="text-sm font-code">
                        /{pron.pronunciation}/
                      </span>
                      {pron.audio && (
                        <div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full p-0 w-6 h-6"
                            onClick={() => {
                              const audio = document.getElementById(
                                `${posItem.type}-${pron.region}`
                              ) as HTMLAudioElement;
                              if (audio) {
                                audio.play();
                              }
                            }}
                          >
                            <Volume2Icon className="w-4 h-4" />
                          </Button>
                          <audio
                            className="hidden"
                            id={`${posItem.type}-${pron.region}`}
                            src={pron.audio}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <ul className="list-disc pl-4">
                  {posItem.definitions.map((def, i) => (
                    <li key={`pos-${i}`} className="">
                      {def.definition}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <Separator className="my-2" />
      <div className="text-sm italic text-muted-foreground mb-2">
        {t("AiDictionary")}
      </div>
      {lookupResult ? (
        <div className="mb-4 select-text">
          <div className="mb-2">
            {lookupResult.meaning?.pos && (
              <span className="italic text-sm text-muted-foreground mr-2">
                {lookupResult.meaning.pos}
              </span>
            )}
            {lookupResult.meaning?.pronunciation && (
              <span className="text-sm font-code mr-2">
                /{lookupResult.meaning.pronunciation}/
              </span>
            )}
            {lookupResult.meaning?.lemma &&
              lookupResult.meaning.lemma !== lookupResult.meaning.word && (
                <span className="text-sm">({lookupResult.meaning.lemma})</span>
              )}
          </div>
          <div className="text-serif">{lookupResult.meaning.translation}</div>
          <div className="text-serif">{lookupResult.meaning.definition}</div>
        </div>
      ) : (
        <div className="flex items-center space-x-2 py-2">
          <Button size="sm" disabled={lookingUp} onClick={lookup}>
            {lookingUp && <LoaderIcon className="animate-spin w-4 h-4 mr-2" />}
            <span>{t("AiTranslate")}</span>
          </Button>
        </div>
      )}
    </>
  );
};
