import { useEffect, useState, useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import cloneDeep from "lodash/cloneDeep";
import { Button, toast, ScrollArea, Separator } from "@renderer/components/ui";
import { t } from "i18next";
import { LanguagesIcon, SpeechIcon } from "lucide-react";
import { Timeline } from "echogarden/dist/utilities/Timeline.d.js";
import { IPA_MAPPING } from "@/constants";
import { useAiCommand } from "@renderer/hooks";
import { LoaderIcon } from "lucide-react";

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

  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);
  const [displayTranslation, setDisplayTranslation] = useState<boolean>(false);

  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<LookupType>();

  const caption = (transcription?.result?.timeline as Timeline)?.[
    currentSegmentIndex
  ];

  const { translate, lookupWord } = useAiCommand();

  const lookup = () => {
    if (selectedIndices.length === 0) return;

    const word = selectedIndices
      .map((index) => caption.timeline[index].text)
      .join(" ");
    setLookingUp(true);
    lookupWord({
      word,
      context: caption.text,
      sourceId: transcription.targetId,
      sourceType: transcription.targetType,
    })
      .then((lookup) => {
        if (lookup?.meaning) {
          setLookupResult(lookup);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLookingUp(false);
      });
  };

  const toggleTranslation = async () => {
    if (translating) return;

    if (translation) {
      setDisplayTranslation(!displayTranslation);
      return;
    }

    toast.promise(
      translate(caption.text)
        .then((result) => {
          if (result) {
            setTranslation(result);
            setDisplayTranslation(true);
          }
        })
        .finally(() => {
          setTranslating(false);
        }),
      {
        loading: t("translating"),
        success: t("translatedSuccessfully"),
        error: (err) => t("translationFailed", { error: err.message }),
        position: "bottom-right",
      }
    );
  };

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

    if (!activeRegion.id.startsWith("word-region")) {
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

    if (indices.length > 0) {
      const el = document.getElementById(
        `word-${currentSegmentIndex}-${indices[0]}`
      );
    }
    setSelectedIndices(indices);
    setLookupResult(undefined);
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

  useEffect(() => {
    setTranslation(undefined);
    setDisplayTranslation(false);
  }, [caption]);

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
          {caption.text.split(" ").length === caption.timeline.length
            ? caption.text.split(" ").map((word, index) => (
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
                      <div className="text-muted-foreground">
                        {caption.timeline[index].timeline
                          .map((t) =>
                            t.timeline
                              .map((s) => IPA_MAPPING[s.text] || s.text)
                              .join("")
                          )
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))
            : (caption.timeline || []).map((w, index) => (
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
                      <div className="text-muted-foreground">
                        {w.timeline
                          .map((t) =>
                            t.timeline
                              .map((s) => IPA_MAPPING[s.text] || s.text)
                              .join("")
                          )
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
        </div>

        {displayTranslation && translation && (
          <>
            <Separator className="my-2" />
            <div className="text-sm font-semibold py-2">{t("translation")}</div>
            <div className="select-text py-2 text-sm text-foreground">
              {translation}
            </div>
          </>
        )}

        {selectedIndices.length > 0 && (
          <>
            <Separator className="my-2" />
            <div className="flex flex-wrap items-center space-x-2 select-text mb-4">
              {selectedIndices.map((index) => {
                const word = caption.timeline[index];
                if (!word) return;
                return (
                  <div key={index}>
                    <div className="font-serif text-lg font-semibold tracking-tight">
                      {word.text}
                    </div>
                    <div className="text-sm text-serif text-muted-foreground">
                      <span className="mr-2">
                        /
                        {word.timeline
                          .map((t) =>
                            t.timeline
                              .map((s) => IPA_MAPPING[s.text] || s.text)
                              .join("")
                          )
                          .join(" · ")}
                        /
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {lookupResult ? (
              <div className="py-2 select-text">
                <div className="text-serif">
                  {lookupResult.meaning.translation}
                </div>
                <div className="text-serif">
                  {lookupResult.meaning.definition}
                </div>
              </div>
            ) : (
              <div className="flex items-center py-2">
                <Button size="sm" disabled={lookingUp} onClick={lookup}>
                  {lookingUp && (
                    <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
                  )}
                  <span>{t("translate")}</span>
                </Button>
              </div>
            )}
          </>
        )}
      </ScrollArea>

      <div className="flex flex-col space-y-2">
        <Button
          variant={displayTranslation ? "secondary" : "outline"}
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          disabled={translating}
          onClick={toggleTranslation}
        >
          <LanguagesIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={displayIpa ? "secondary" : "outline"}
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          onClick={() => setDisplayIpa(!displayIpa)}
        >
          <SpeechIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
