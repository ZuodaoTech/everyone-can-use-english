import { useEffect, useState, useContext, useRef } from "react";
import {
  AppSettingsProviderContext,
  MediaShadowProviderContext,
} from "@renderer/context";
import cloneDeep from "lodash/cloneDeep";
import {
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from "@renderer/components/ui";
import { MediaCaption, MediaCaptionActions } from "@renderer/components";
import { t } from "i18next";
import {
  Timeline,
  TimelineEntry,
} from "echogarden/dist/utilities/Timeline.d.js";
import {
  MediaCaptionAnalysis,
  MediaCaptionNote,
  MediaCaptionTranslation,
} from "@renderer/components";

export const MediaRightPanel = () => {
  const {
    currentSegmentIndex,
    currentTime,
    transcription,
    regions,
    activeRegion,
    setActiveRegion,
    editingRegion,
    setEditingRegion,
    setTranscriptionDraft,
  } = useContext(MediaShadowProviderContext);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [multiSelecting, setMultiSelecting] = useState<boolean>(false);

  const [displayIpa, setDisplayIpa] = useState<boolean>(true);
  const [displayNotes, setDisplayNotes] = useState<boolean>(true);

  const [caption, setCaption] = useState<TimelineEntry | null>(null);
  const [tab, setTab] = useState<string>("translation");

  const toggleMultiSelect = (event: KeyboardEvent) => {
    setMultiSelecting(event.shiftKey && event.type === "keydown");
  };

  const toggleSeletedIndex = (index: number) => {
    if (!activeRegion) return;
    if (editingRegion) {
      toast.warning(t("currentRegionIsBeingEdited"));
      return;
    }

    const startWord = caption.timeline[index];
    if (!startWord) return;

    if (multiSelecting) {
      const min = Math.min(index, ...selectedIndices);
      const max = Math.max(index, ...selectedIndices);

      // Select all the words between the min and max indices.
      setSelectedIndices(
        Array.from({ length: max - min + 1 }, (_, i) => i + min)
      );
    } else if (selectedIndices.includes(index)) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices([index]);
    }
  };

  const toggleRegion = (params: number[]) => {
    if (!activeRegion) return;
    if (editingRegion) {
      toast.warning(t("currentRegionIsBeingEdited"));
      return;
    }
    if (params.length === 0) {
      if (activeRegion.id.startsWith("word-region")) {
        activeRegion.remove();
        setActiveRegion(
          regions.getRegions().find((r) => r.id.startsWith("segment-region"))
        );
      }
      return;
    }

    const startIndex = Math.min(...params);
    const endIndex = Math.max(...params);

    const startWord = caption.timeline[startIndex];
    if (!startWord) return;

    const endWord = caption.timeline[endIndex] || startWord;

    const start = startWord.startTime;
    const end = endWord.endTime;

    // If the active region is a word region, then merge the selected words into a single region.
    if (activeRegion.id.startsWith("word-region")) {
      activeRegion.remove();

      const region = regions.addRegion({
        id: `word-region-${startIndex}`,
        start,
        end,
        color: "#fb6f9233",
        drag: false,
        resize: editingRegion,
      });

      setActiveRegion(region);
      // If the active region is a meaning group region, then active the segment region.
    } else if (activeRegion.id.startsWith("meaning-group-region")) {
      setActiveRegion(
        regions.getRegions().find((r) => r.id.startsWith("segment-region"))
      );
      // If the active region is a segment region, then create a new word region.
    } else {
      const region = regions.addRegion({
        id: `word-region-${startIndex}`,
        start,
        end,
        color: "#fb6f9233",
        drag: false,
        resize: false,
      });

      setActiveRegion(region);
    }
  };

  useEffect(() => {
    if (!caption) return;

    let index = caption.timeline.findIndex(
      (w) => currentTime >= w.startTime && currentTime < w.endTime
    );

    if (index < 0) return;
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [currentTime, caption]);

  useEffect(() => {
    if (!caption?.timeline) return;
    if (!activeRegion) return;

    toggleRegion(selectedIndices);
  }, [caption, selectedIndices]);

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

    activeRegion?.remove();
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
    return () => setSelectedIndices([]);
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

  if (!transcription) return null;
  if (!caption) return null;

  return (
    <div className="h-full relative">
      <div className="flex-1 font-serif h-full">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value)}
          className="h-full flex flex-col"
        >
          <TabsList className="grid grid-cols-3 gap-4 rounded-none w-full px-4">
            <TabsTrigger
              value="translation"
              className="capitalize block truncate px-1"
            >
              {t("captionTabs.translation")}
            </TabsTrigger>
            <TabsTrigger
              value="note"
              className="capitalize block truncate px-1"
            >
              {t("captionTabs.note")}
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="capitalize block truncate px-1"
            >
              {t("captionTabs.analysis")}
            </TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-1 relative">
            <MediaCaption
              caption={caption}
              language={transcription.language}
              selectedIndices={selectedIndices}
              currentSegmentIndex={currentSegmentIndex}
              activeIndex={activeIndex}
              displayIpa={displayIpa}
              displayNotes={displayNotes}
              onClick={toggleSeletedIndex}
            />

            <div className="px-4 pb-10 min-h-32">
              <MediaCaptionNote
                currentSegmentIndex={currentSegmentIndex}
                selectedIndices={selectedIndices}
                setSelectedIndices={setSelectedIndices}
              />

              <MediaCaptionTranslation
                caption={caption}
                selectedIndices={selectedIndices}
              />

              <MediaCaptionAnalysis text={caption.text} />
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      <div className="absolute bottom-4 right-4">
        <MediaCaptionActions
          caption={caption}
          displayIpa={displayIpa}
          setDisplayIpa={setDisplayIpa}
          displayNotes={displayNotes}
          setDisplayNotes={setDisplayNotes}
        />
      </div>
    </div>
  );
};
