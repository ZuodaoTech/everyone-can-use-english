import { useEffect, useState, useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import cloneDeep from "lodash/cloneDeep";
import { Button, toast } from "@renderer/components/ui";
import { ConversationShortcuts } from "@renderer/components";
import { t } from "i18next";
import { BotIcon, CopyIcon, CheckIcon, SpeechIcon } from "lucide-react";
import {
  Timeline,
  TimelineEntry,
} from "echogarden/dist/utilities/Timeline.d.js";
import { convertIpaToNormal } from "@/utils";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { MediaCaptionTabs } from "./media-captions";

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

  const [caption, setCaption] = useState<TimelineEntry | null>(null);

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
      activeRegion?.remove();
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

  useEffect(() => {
    setCaption(
      (transcription?.result?.timeline as Timeline)?.[currentSegmentIndex]
    );
  }, [currentSegmentIndex, transcription]);

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
      <div className="flex-1 font-serif h-full border shadow-lg rounded-lg">
        <MediaCaptionTabs
          caption={caption}
          currentSegmentIndex={currentSegmentIndex}
          selectedIndices={selectedIndices}
          toggleRegion={toggleRegion}
        >
          <div className="flex flex-wrap px-4 py-2 rounded-t-lg bg-muted/50">
            {/* use the words splitted by caption text if it is matched with the timeline length, otherwise use the timeline */}
            {caption.text.split(" ").length !== caption.timeline.length
              ? (caption.timeline || []).map((w, index) => (
                  <div
                    key={index}
                    id={`word-${currentSegmentIndex}-${index}`}
                    className={`p-1 pb-2 rounded cursor-pointer hover:bg-red-500/10 ${
                      index === activeIndex ? "text-red-500" : ""
                    } ${
                      selectedIndices.includes(index)
                        ? "bg-red-500/10 selected"
                        : ""
                    }`}
                    onClick={() => toggleRegion(index)}
                  >
                    <div className="">
                      <div className="font-serif text-lg xl:text-xl 2xl:text-2xl">
                        {w.text}
                      </div>
                      {displayIpa && (
                        <div
                          className={`text-sm 2xl:text-base text-muted-foreground font-code ${
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
                    className={`p-1 pb-2 rounded cursor-pointer hover:bg-red-500/10 ${
                      index === activeIndex ? "text-red-500" : ""
                    } ${
                      selectedIndices.includes(index) ? "bg-red-500/10" : ""
                    }`}
                    onClick={() => toggleRegion(index)}
                  >
                    <div className="">
                      <div className="text-serif text-lg xl:text-xl 2xl:text-2xl">
                        {word}
                      </div>
                      {displayIpa && (
                        <div
                          className={`text-sm 2xl:text-base text-muted-foreground font-code ${
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
        </MediaCaptionTabs>
      </div>

      <div className="flex flex-col space-y-2">
        <Button
          variant={displayIpa ? "secondary" : "outline"}
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("displayIpa")}
          onClick={() => setDisplayIpa(!displayIpa)}
        >
          <SpeechIcon className="w-4 h-4" />
        </Button>

        <ConversationShortcuts
          prompt={caption.text as string}
          trigger={
            <Button
              data-tooltip-id="media-player-tooltip"
              data-tooltip-content={t("sendToAIAssistant")}
              variant="outline"
              size="sm"
              className="p-0 w-8 h-8 rounded-full"
            >
              <BotIcon className="w-5 h-5" />
            </Button>
          }
        />

        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("copyText")}
          onClick={() => {
            if (displayIpa) {
              const text = caption.timeline
                .map((word) => {
                  const ipa = word.timeline
                    .map((t) =>
                      t.timeline.map((s) => convertIpaToNormal(s.text)).join("")
                    )
                    .join(" · ");
                  return `${word.text}(${ipa})`;
                })
                .join(" ");

              copyToClipboard(text);
            } else {
              copyToClipboard(caption.text);
            }
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
              data-tooltip-id="media-player-tooltip"
              data-tooltip-content={t("copyText")}
              className="w-4 h-4"
            />
          )}
        </Button>
      </div>
    </div>
  );
};
