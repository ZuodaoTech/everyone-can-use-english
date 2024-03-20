import { useEffect, useState, useContext } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import cloneDeep from "lodash/cloneDeep";
import {
  Button,
  toast,
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@renderer/components/ui";
import { ConversationShortcuts } from "@renderer/components";
import { t } from "i18next";
import { BotIcon, CopyIcon, CheckIcon, SpeechIcon } from "lucide-react";
import { Timeline } from "echogarden/dist/utilities/Timeline.d.js";
import { useAiCommand } from "@renderer/hooks";
import { LoaderIcon } from "lucide-react";
import { convertIpaToNormal } from "@/utils";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { md5 } from "js-md5";
import Markdown from "react-markdown";

export const MediaCaption = () => {
  const {
    wavesurfer,
    currentSegmentIndex,
    currentTime,
    transcription,
    regions,
    activeRegion,
    setActiveRegion,
    editingRegion,
    setEditingRegion,
    setTranscriptionDraft,
  } = useContext(MediaPlayerProviderContext);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [multiSelecting, setMultiSelecting] = useState<boolean>(false);

  const [displayIpa, setDisplayIpa] = useState<boolean>(true);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);

  const caption = (transcription?.result?.timeline as Timeline)?.[
    currentSegmentIndex
  ];

  const toggleMultiSelect = (event: KeyboardEvent) => {
    setMultiSelecting(event.shiftKey && event.type === "keydown");
  };

  const toggleRegion = (index: number) => {
    if (!activeRegion) return;
    if (editingRegion) {
      toast.warning(t("currentRegionIsBeingEdited"));
      return;
    }

    const word = caption.timeline[index];
    if (!word) return;

    const start = word.startTime;
    const end = word.endTime;
    const regionStart = activeRegion.start;
    const regionEnd = activeRegion.end;

    if (activeRegion.id.startsWith("word-region")) {
      if (start >= regionStart && end <= regionEnd) {
        setActiveRegion(
          regions.getRegions().find((r) => r.id.startsWith("segment-region"))
        );
      } else if (multiSelecting) {
        const region = regions.addRegion({
          id: `word-region-${index}`,
          start: Math.min(start, regionStart),
          end: Math.max(end, regionEnd),
          color: "#fb6f9233",
          drag: false,
          resize: editingRegion,
        });

        setActiveRegion(region);
      } else {
        const region = regions.addRegion({
          id: `word-region-${index}`,
          start,
          end,
          color: "#fb6f9233",
          drag: false,
          resize: editingRegion,
        });

        setActiveRegion(region);
      }
      activeRegion.remove();
    } else if (activeRegion.id.startsWith("meaning-group-region")) {
      setActiveRegion(
        regions.getRegions().find((r) => r.id.startsWith("segment-region"))
      );
    } else {
      const region = regions.addRegion({
        id: `word-region-${index}`,
        start,
        end,
        color: "#fb6f9233",
        drag: false,
        resize: false,
      });

      setActiveRegion(region);
    }
  };

  const markPhoneRegions = () => {
    const phoneRegions = regions
      .getRegions()
      .filter((r) => r.id.startsWith("phone-region"));
    if (phoneRegions.length > 0) {
      phoneRegions.forEach((r) => {
        r.remove();
        r.unAll();
      });
      return;
    }

    if (!activeRegion) return;
    if (!activeRegion.id.startsWith("word-region")) return;
    if (!selectedIndices) return;

    selectedIndices.forEach((index) => {
      const word = caption.timeline[index];

      word.timeline.forEach((token) => {
        token.timeline.forEach((phone) => {
          const region = regions.addRegion({
            id: `phone-region-${index}`,
            start: phone.startTime,
            end: phone.endTime,
            color: "#efefefef",
            drag: false,
            resize: editingRegion,
          });
          region.on("click", () => {
            region.play();
          });
        });
      });
    });
  };

  useEffect(() => {
    if (!caption) return;

    const index = caption.timeline.findIndex(
      (w) => currentTime >= w.startTime && currentTime < w.endTime
    );

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [currentTime, caption]);

  useEffect(() => {
    if (!caption?.timeline) return;
    if (!activeRegion) return;

    if (activeRegion.id.startsWith("segment-region")) {
      setSelectedIndices([]);
      return;
    }

    const indices: number[] = [];
    caption.timeline.forEach((w, index) => {
      if (
        w.startTime >= activeRegion.start &&
        (w.endTime <= activeRegion.end ||
          // The last word's end time may be a little greater than the duration of the audio in somehow.
          w.endTime > wavesurfer.getDuration())
      ) {
        indices.push(index);
      }
    });

    setSelectedIndices(indices);
  }, [caption, activeRegion]);

  useEffect(() => {
    if (!activeRegion) return;
    if (!activeRegion.id.startsWith("word-region")) return;

    const region = regions.addRegion({
      id: `word-region-${selectedIndices.join("-")}`,
      start: activeRegion.start,
      end: activeRegion.end,
      color: "#fb6f9233",
      drag: false,
      resize: editingRegion,
    });

    activeRegion.remove();
    setActiveRegion(region);

    const subscriptions = [
      regions.on("region-updated", (region) => {
        if (!region.id.startsWith("word-region")) return;

        const draft = cloneDeep(transcription.result);
        const draftCaption = draft.timeline[currentSegmentIndex];

        const firstIndex = selectedIndices[0];
        const lastIndex = selectedIndices[selectedIndices.length - 1];
        const firstWord = draftCaption.timeline[firstIndex];
        const lastWord = draftCaption.timeline[lastIndex];

        // If no word is selected somehow, then ignore the update.
        if (!firstWord || !lastWord) {
          setEditingRegion(false);
          return;
        }

        firstWord.startTime = region.start;
        lastWord.endTime = region.end;

        /* Update the timeline of the previous and next words
         * It happens only when regions are intersecting with the previous or next word.
         * It will ignore if the previous/next word's position changed in timestamps.
         */
        const prevWord = draftCaption.timeline[firstIndex - 1];
        const nextWord = draftCaption.timeline[lastIndex + 1];
        if (
          prevWord &&
          prevWord.endTime > region.start &&
          prevWord.startTime < region.start
        ) {
          prevWord.endTime = region.start;
        }
        if (
          nextWord &&
          nextWord.startTime < region.end &&
          nextWord.endTime > region.end
        ) {
          nextWord.startTime = region.end;
        }

        /*
         * If the last word is the last word of the segment, then update the segment's end time.
         */
        if (lastIndex === draftCaption.timeline.length - 1) {
          draftCaption.endTime = region.end;
        }

        setTranscriptionDraft(draft);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [editingRegion]);

  useEffect(() => {}, [caption]);

  useEffect(() => {
    document.addEventListener("keydown", (event: KeyboardEvent) =>
      toggleMultiSelect(event)
    );
    document.addEventListener("keyup", (event: KeyboardEvent) =>
      toggleMultiSelect(event)
    );

    return () => {
      document.removeEventListener("keydown", toggleMultiSelect);
      document.removeEventListener("keyup", toggleMultiSelect);
    };
  }, []);

  if (!caption) return null;

  return (
    <div className="h-full flex justify-between space-x-4">
      <ScrollArea className="flex-1 px-6 py-4 font-serif h-full border shadow-lg rounded-lg">
        <div className="flex flex-wrap mb-4">
          {/* use the words splitted by caption text if it is matched with the timeline length, otherwise use the timeline */}
          {caption.text.split(" ").length !== caption.timeline.length
            ? (caption.timeline || []).map((w, index) => (
                <div
                  key={index}
                  id={`word-${currentSegmentIndex}-${index}`}
                  className={`pr-2 pb-2 cursor-pointer hover:bg-red-500/10 ${
                    index === activeIndex ? "text-red-500" : ""
                  } ${
                    selectedIndices.includes(index)
                      ? "bg-red-500/10 selected"
                      : ""
                  }`}
                  onClick={() => toggleRegion(index)}
                >
                  <div className="">
                    <div className="text-2xl">{w.text}</div>
                    {displayIpa && (
                      <div
                        className={`text-muted-foreground font-code ${
                          index === 0 ? "before:content-['/']" : ""
                        }
                        ${
                          index === caption.timeline.length - 1
                            ? "after:content-['/']"
                            : ""
                        }`}
                      >
                        {w.timeline
                          .map((t) =>
                            t.timeline
                              .map((s) => convertIpaToNormal(s.text))
                              .join("")
                          )
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))
            : caption.text.split(" ").map((word, index) => (
                <div
                  key={index}
                  id={`word-${currentSegmentIndex}-${index}`}
                  className={`pr-2 pb-2 cursor-pointer hover:bg-red-500/10 ${
                    index === activeIndex ? "text-red-500" : ""
                  } ${selectedIndices.includes(index) ? "bg-red-500/10" : ""}`}
                  onClick={() => toggleRegion(index)}
                >
                  <div className="">
                    <div className="text-2xl">{word}</div>
                    {displayIpa && (
                      <div
                        className={`text-muted-foreground font-code ${
                          index === 0 ? "before:content-['/']" : ""
                        }
                        ${
                          index === caption.text.split(" ").length - 1
                            ? "after:content-['/']"
                            : ""
                        }`}
                      >
                        {caption.timeline[index].timeline
                          .map((t) =>
                            t.timeline
                              .map((s) => convertIpaToNormal(s.text))
                              .join("")
                          )
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
        </div>

        <CaptionTabs
          selectedIndices={selectedIndices}
          toggleRegion={toggleRegion}
        />
      </ScrollArea>

      <div className="flex flex-col space-y-2">
        <Button
          variant={displayIpa ? "secondary" : "outline"}
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("displayIpa")}
          onClick={() => setDisplayIpa(!displayIpa)}
        >
          <SpeechIcon className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("copyText")}
          onClick={() => {
            copyToClipboard(caption.text);
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 1500);
          }}
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-green-500" />
          ) : (
            <CopyIcon
              data-tooltip-id="media-player-controls-tooltip"
              data-tooltip-content={t("copyText")}
              className="w-4 h-4"
            />
          )}
        </Button>
      </div>
    </div>
  );
};

/*
 * Tabs below the caption text.
 * It provides the translation, analysis, and note features.
 */
const CaptionTabs = (props: {
  selectedIndices: number[];
  toggleRegion: (index: number) => void;
}) => {
  const { selectedIndices, toggleRegion } = props;
  const { transcription, currentSegmentIndex } = useContext(
    MediaPlayerProviderContext
  );
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);

  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);

  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<LookupType>();

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>();

  const [hash, setHash] = useState<string>();

  const [tab, setTab] = useState<string>("selected");

  const { translate, lookupWord, analyzeText } = useAiCommand();
  const caption = (transcription?.result?.timeline as Timeline)?.[
    currentSegmentIndex
  ];

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

  const translateSetence = async (options?: { force?: boolean }) => {
    if (translating) return;

    const { force } = options || {};
    setTranslating(true);
    translate(caption.text, force ? null : `translate-${hash}`)
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

  const analyzeSetence = async (options?: { force?: boolean }) => {
    if (analyzing) return;

    const { force } = options || {};
    setAnalyzing(true);
    analyzeText(caption.text, force ? null : `analyze-${hash}`)
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

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value)}
      className="border rounded-lg"
    >
      <TabsList className="grid grid-cols-4 gap-4 rounded-b-none sticky top-0">
        <TabsTrigger value="selected">{t("captionTabs.selected")}</TabsTrigger>
        <TabsTrigger value="translation">
          {t("captionTabs.translation")}
        </TabsTrigger>
        <TabsTrigger value="analysis">{t("captionTabs.analysis")}</TabsTrigger>
        <TabsTrigger value="note">{t("captionTabs.note")}</TabsTrigger>
      </TabsList>

      <div className="px-4 pb-2 min-h-32">
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
            </>
          ) : (
            <div className="text-muted-foreground py-4">
              {t("clickAnyWordToSelect")}
            </div>
          )}
        </TabsContent>

        <TabsContent value="translation">
          {translation ? (
            <>
              <div className="mb-2 flex items-center justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => translateSetence({ force: true })}
                >
                  {t("reTranslate")}
                </Button>
              </div>
              <div className="select-text text-sm text-foreground">
                {translation}
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
              <div className="mb-2 flex items-center space-x-2 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => analyzeSetence({ force: true })}
                >
                  {t("reAnalyze")}
                </Button>
                <AIButton
                  prompt={caption.text as string}
                  onReply={(replies) => {
                    const result = replies.map((m) => m.content).join("\n");
                    setAnalysisResult(result);
                    EnjoyApp.cacheObjects.set(`analyze-${hash}`, result);
                  }}
                />
              </div>
              <Markdown
                className="select-text prose prose-sm prose-h3:text-base max-w-full"
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
            </>
          ) : (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                size="sm"
                disabled={analyzing}
                onClick={() => analyzeSetence()}
              >
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
  onReply: (replies: MessageType[]) => void;
}) => {
  const { prompt, onReply } = props;
  const [asking, setAsking] = useState<boolean>(false);
  return (
    <ConversationShortcuts
      open={asking}
      onOpenChange={setAsking}
      prompt={prompt}
      onReply={onReply}
      trigger={
        <Button
          data-tooltip-id="media-player-controls-tooltip"
          data-tooltip-content={t("sendToAIAssistant")}
          variant="outline"
          size="sm"
          className="p-0 w-8 h-8 rounded-full"
        >
          <BotIcon className="w-5 h-5 text-muted-foreground hover:text-primary" />
        </Button>
      }
    />
  );
};
