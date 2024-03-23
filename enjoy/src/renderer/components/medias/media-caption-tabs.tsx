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
} from "@renderer/components/ui";
import { ConversationShortcuts } from "@renderer/components";
import { t } from "i18next";
import { BotIcon } from "lucide-react";
import {
  Timeline,
  TimelineEntry,
} from "echogarden/dist/utilities/Timeline.d.js";
import { useAiCommand, useCamdict } from "@renderer/hooks";
import { LoaderIcon } from "lucide-react";
import { convertIpaToNormal } from "@/utils";
import { md5 } from "js-md5";
import Markdown from "react-markdown";

/*
 * Tabs below the caption text.
 * It provides the translation, analysis, and note features.
 */
export const MediaCaptionTabs = (props: {
  selectedIndices: number[];
  toggleRegion: (index: number) => void;
}) => {
  const { selectedIndices, toggleRegion } = props;
  const { transcription, currentSegmentIndex } = useContext(
    MediaPlayerProviderContext
  );
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);

  const [caption, setCaption] = useState<TimelineEntry>();

  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);

  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<LookupType>();

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>();

  const [hash, setHash] = useState<string>();

  const [tab, setTab] = useState<string>("selected");

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

  const translateSetence = async () => {
    if (translating) return;

    setTranslating(true);
    translate(caption.text, `translate-${hash}`)
      .then((result) => {
        if (result) {
          setTranslation(result);
        }
      })
      .catch((err) => t("translationFailed", { error: err.message }))
      .finally(() => {
        setTranslating(false);
      });
  };

  const analyzeSetence = async () => {
    if (analyzing) return;

    setAnalyzing(true);
    analyzeText(caption.text, `analyze-${hash}`)
      .then((result) => {
        if (result) {
          setAnalysisResult(result);
        }
      })
      .catch((err) => t("analysisFailed", { error: err.message }))
      .finally(() => {
        setAnalyzing(false);
      });
  };

  const { translate, lookupWord, analyzeText } = useAiCommand();

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

  /*
   * If the caption is changed, then reset the translation and lookup result.
   * Also, check if the translation is cached, then use it.
   */
  useEffect(() => {
    if (!caption) return;

    const md5Hash = md5.create();
    md5Hash.update(caption.text);
    setHash(md5Hash.hex());

    EnjoyApp.cacheObjects.get(`translate-${md5Hash.hex()}`).then((cached) => {
      setTranslation(cached);
    });

    EnjoyApp.cacheObjects.get(`analyze-${md5Hash.hex()}`).then((cached) => {
      setAnalysisResult(cached);
    });
  }, [caption]);

  useEffect(() => {
    setCaption(
      (transcription?.result?.timeline as Timeline)?.[currentSegmentIndex]
    );
  }, [currentSegmentIndex, translation]);

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
        <TabsContent value="selected">
          {selectedIndices.length > 0 ? (
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
                            .join(" · ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {lookupResult && (
                <div className="py-2 select-text">
                  <div className="text-serif">
                    {lookupResult.meaning.translation}
                  </div>
                  <div className="text-serif">
                    {lookupResult.meaning.definition}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 py-2">
                {!lookupResult && (
                  <Button size="sm" disabled={lookingUp} onClick={lookup}>
                    {lookingUp && (
                      <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
                    )}
                    <span>{t("translate")}</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleRegion(selectedIndices[0])}
                >
                  {t("cancel")}
                </Button>
              </div>

              {camdictResult && (
                <div className="py-2 select-text">
                  <div className="text-serif">{camdictResult.word}</div>
                  {camdictResult.posItems.map((posItem, index) => (
                    <div key={index} className="">
                      {posItem.definitions.map((def, i) => (
                        <div key={`pos-${i}`} className="">
                          {def.definition}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-4">
              {t("clickAnyWordToSelect")}
            </div>
          )}
        </TabsContent>

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
                    } catch (e) {}

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
                  prompt={caption.text as string}
                  onReply={(replies) => {
                    const result = replies.map((m) => m.content).join("\n");
                    setAnalysisResult(result);
                    EnjoyApp.cacheObjects.set(`analyze-${hash}`, result);
                  }}
                  tooltip={t("useAIAssistantToAnalyze")}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button size="sm" disabled={analyzing} onClick={analyzeSetence}>
                {analyzing && (
                  <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
                )}
                <span>{t("analyzeSetence")}</span>
              </Button>
              <AIButton
                prompt={caption.text as string}
                onReply={(replies) => {
                  const result = replies.map((m) => m.content).join("\n");
                  setAnalysisResult(result);
                  EnjoyApp.cacheObjects.set(`analyze-${hash}`, result);
                }}
                tooltip={t("useAIAssistantToAnalyze")}
              />
            </div>
          )}
        </TabsContent>

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
