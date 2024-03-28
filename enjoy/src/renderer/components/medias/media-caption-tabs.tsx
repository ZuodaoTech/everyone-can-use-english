import { useEffect, useState, useContext } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import {
  Button,
  toast,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Separator,
} from "@renderer/components/ui";
import { ConversationShortcuts } from "@renderer/components";
import { t } from "i18next";
import { BotIcon } from "lucide-react";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { useAiCommand, useCamdict } from "@renderer/hooks";
import { LoaderIcon, Volume2Icon } from "lucide-react";
import { convertIpaToNormal } from "@/utils";
import { md5 } from "js-md5";
import Markdown from "react-markdown";

/*
 * Tabs below the caption text.
 * It provides the translation, analysis, and note features.
 */
export const MediaCaptionTabs = (props: {
  caption: TimelineEntry;
  selectedIndices: number[];
  toggleRegion: (index: number) => void;
}) => {
  const { caption, selectedIndices, toggleRegion } = props;

  const [tab, setTab] = useState<string>("selected");

  if (!caption) return null;

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value)} className="">
      <TabsList className="grid grid-cols-4 gap-4 rounded-none sticky top-0 px-4 mb-4">
        <TabsTrigger value="selected">{t("captionTabs.selected")}</TabsTrigger>
        <TabsTrigger value="translation">
          {t("captionTabs.translation")}
        </TabsTrigger>
        <TabsTrigger value="analysis">{t("captionTabs.analysis")}</TabsTrigger>
        <TabsTrigger value="note">{t("captionTabs.note")}</TabsTrigger>
      </TabsList>

      <div className="px-4 pb-4 min-h-32">
        <SelectedTabContent
          caption={caption}
          selectedIndices={selectedIndices}
          toggleRegion={toggleRegion}
        />

        <TranslationTabContent text={caption.text} />

        <AnalysisTabContent text={caption.text} />

        <TabsContent value="note">
          <div className="text-muted-foreground text-center py-4">
            Comming soon
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
};

const AIButton = (props: {
  prompt: string;
  onReply?: (replies: MessageType[]) => void;
  tooltip: string;
}) => {
  const { prompt, onReply, tooltip } = props;
  return (
    <ConversationShortcuts
      prompt={prompt}
      onReply={onReply}
      title={tooltip}
      trigger={
        <Button
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={tooltip}
          variant="outline"
          size="sm"
          className="p-0 w-8 h-8 rounded-full"
        >
          <BotIcon className="w-5 h-5" />
        </Button>
      }
    />
  );
};

const SelectedTabContent = (props: {
  caption: TimelineEntry;
  selectedIndices: number[];
  toggleRegion: (index: number) => void;
}) => {
  const { selectedIndices, caption, toggleRegion } = props;

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
      <TabsContent value="selected">
        <div className="text-sm text-muted-foreground py-4">
          {t("clickAnyWordToSelect")}
        </div>
      </TabsContent>
    );

  return (
    <TabsContent value="selected">
      <div className="flex flex-wrap items-center space-x-2 select-text mb-4">
        {selectedIndices.map((index, i) => {
          const word = caption.timeline[index];
          if (!word) return;
          return (
            <div key={index}>
              <div className="font-serif text-lg font-semibold tracking-tight">
                {word.text}
              </div>
              {
                word.timeline.length > 0 && (
                  <div className="text-sm text-serif text-muted-foreground">
                    <span
                      className={`mr-2 font-code ${i === 0 ? "before:content-['/']" : ""
                        }
                        ${i === selectedIndices.length - 1
                          ? "after:content-['/']"
                          : ""
                        }`}
                    >
                      {word.timeline
                        .map((t) =>
                          t.timeline.map((s) => convertIpaToNormal(s.text)).join("")
                        )
                        .join("")}
                    </span>
                  </div>
                )
              }
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
                <div className="flex items-center space-x-4 mb-2">
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

      <div className="flex items-center justify-end py-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => toggleRegion(selectedIndices[0])}
        >
          {t("cancel")}
        </Button>
      </div>
    </TabsContent>
  );
};

/*
 * Translation tab content.
 */
const TranslationTabContent = (props: { text: string }) => {
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
          <Markdown className="select-text prose prose-sm prose-h3:text-base max-w-full mb-4">
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
};

const AnalysisTabContent = (props: { text: string }) => {
  const { text } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>();

  const { analyzeText } = useAiCommand();

  const analyzeSetence = async () => {
    if (analyzing) return;

    setAnalyzing(true);
    analyzeText(text, `analyze-${md5(text)}`)
      .then((result) => {
        if (result) {
          setAnalysisResult(result);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => {
        setAnalyzing(false);
      });
  };

  /*
   * If the caption is changed, then reset the analysis.
   * Also, check if the translation is cached, then use it.
   */
  useEffect(() => {
    EnjoyApp.cacheObjects.get(`analyze-${md5(text)}`).then((cached) => {
      setAnalysisResult(cached);
    });
  }, [text]);

  return (
    <TabsContent value="analysis">
      {analysisResult ? (
        <>
          <Markdown
            className="select-text prose prose-sm prose-h3:text-base max-w-full mb-4"
            components={{
              a({ node, children, ...props }) {
                try {
                  new URL(props.href ?? "");
                  props.target = "_blank";
                  props.rel = "noopener noreferrer";
                } catch (e) { }

                return <a {...props}>{children}</a>;
              },
            }}
          >
            {analysisResult}
          </Markdown>

          <div className="flex items-center space-x-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              disabled={analyzing}
              onClick={analyzeSetence}
            >
              {analyzing && (
                <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
              )}
              {t("reAnalyze")}
            </Button>
            <AIButton
              prompt={text as string}
              onReply={(replies) => {
                const result = replies.map((m) => m.content).join("\n");
                setAnalysisResult(result);
                EnjoyApp.cacheObjects.set(`analyze-${md5(text)}`, result);
              }}
              tooltip={t("useAIAssistantToAnalyze")}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button size="sm" disabled={analyzing} onClick={analyzeSetence}>
            {analyzing && <LoaderIcon className="animate-spin w-4 h-4 mr-2" />}
            <span>{t("analyzeSetence")}</span>
          </Button>
          <AIButton
            prompt={text as string}
            onReply={(replies) => {
              const result = replies.map((m) => m.content).join("\n");
              setAnalysisResult(result);
              EnjoyApp.cacheObjects.set(`analyze-${md5(text)}`, result);
            }}
            tooltip={t("useAIAssistantToAnalyze")}
          />
        </div>
      )}
    </TabsContent>
  );
};
