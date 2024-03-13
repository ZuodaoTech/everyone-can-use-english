import { useEffect, useState, useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import cloneDeep from "lodash/cloneDeep";
import { Button, toast } from "@renderer/components/ui";
import { t } from "i18next";
import { LanguagesIcon, SpeechIcon } from "lucide-react";
import { Timeline } from "echogarden/dist/utilities/Timeline.d.js";
import { IPA_MAPPING } from "@/constants";

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

  if (!caption) return <div></div>;

  return (
    <div className="flex justify-between min-h-[calc(70vh-28.5rem)] py-4">
      <div className="flex-1 px-4 py-2 flex-1 font-serif h-full">
        <div className="flex flex-wrap">
          {caption.text.split(" ").length === caption.timeline.length
            ? caption.text.split(" ").map((word, index) => (
                <div
                  key={index}
                  className={`pr-2 cursor-pointer hover:bg-red-500/10 ${
                    index === activeIndex ? "text-red-500" : ""
                  } ${selectedIndices.includes(index) ? "bg-red-500/10" : ""}`}
                  onClick={() => toggleRegion(index)}
                >
                  <div className="">
                    <div className="text-2xl">{word}</div>
                    <div className="text-muted-foreground">
                      {caption.timeline[index].timeline
                        .map((t) =>
                          t.timeline
                            .map((s) => (IPA_MAPPING as any)[s.text] || s.text)
                            .join("")
                        )
                        .join()}
                    </div>
                  </div>
                </div>
              ))
            : (caption.timeline || []).map((w, index) => (
                <div
                  key={index}
                  className={`pr-2 cursor-pointer hover:bg-red-500/10 ${
                    index === activeIndex ? "text-red-500" : ""
                  } ${selectedIndices.includes(index) ? "bg-red-500/10" : ""}`}
                  onClick={() => toggleRegion(index)}
                >
                  <div className="">
                    <div className="text-2xl">{w.text}</div>
                    <div className="text-muted-foreground">
                      {w.timeline
                        .map((t) =>
                          t.timeline
                            .map((s) => (IPA_MAPPING as any)[s.text] || s.text)
                            .join("")
                        )
                        .join()}
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>

      <div className="w-56 rounded-lg shadow border px-4 py-2 mr-4">
        {selectedIndices.length > 0 ? (
          <div className="flex items-center space-x-2">
            {selectedIndices.map((index) => {
              const word = caption.timeline[index];
              if (!word) return;
              return (
                <div key={index}>
                  <div className="font-serif text-lg font-semibold tracking-tight">
                    {word.text}
                  </div>
                  <div className="text-muted-foreground">
                    {word.timeline
                      .map((t) =>
                        t.timeline
                          .map((s) => (IPA_MAPPING as any)[s.text] || s.text)
                          .join("")
                      )
                      .join("")}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>{t("clickAnyWordToSelect")}</div>
        )}
      </div>
      <div className="flex flex-col space-y-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 p-0"
        >
          <LanguagesIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 p-0"
        >
          <SpeechIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
