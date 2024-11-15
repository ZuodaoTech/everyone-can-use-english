import { useEffect, useState, useContext, useRef, useMemo } from "react";
import { MediaShadowProviderContext } from "@renderer/context";
import cloneDeep from "lodash/cloneDeep";
import {
  Button,
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from "@renderer/components/ui";
import { MediaCaption, MediaCaptionActions } from "@renderer/components";
import { t } from "i18next";
import {
  MediaCaptionAnalysis,
  MediaCaptionNote,
  MediaCaptionTranslation,
} from "@renderer/components";
import { cn } from "@renderer/lib/utils";
import { ArrowLeftRightIcon } from "lucide-react";

export const MediaRightPanel = (props: {
  className?: string;
  setDisplayPanel?: (displayPanel: "left" | "right" | null) => void;
}) => {
  const { className, setDisplayPanel } = props;
  const {
    caption,
    currentSegmentIndex,
    currentTime,
    transcription,
    regions,
    activeRegion,
    setActiveRegion,
    toggleRegion,
    editingRegion,
    setEditingRegion,
    setTranscriptionDraft,
    layout,
  } = useContext(MediaShadowProviderContext);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [multiSelecting, setMultiSelecting] = useState<boolean>(false);

  const [displayIpa, setDisplayIpa] = useState<boolean>(true);
  const [displayNotes, setDisplayNotes] = useState<boolean>(true);

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

  // Edit region to update transcription draft
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
    <div className={cn("h-full relative", className)}>
      <div className="flex-1 font-serif h-full">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value)}
          className="h-full flex flex-col"
        >
          <div className="flex items-center bg-muted px-4">
            {layout === "compact" && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => setDisplayPanel?.("left")}
              >
                <ArrowLeftRightIcon className="w-4 h-4" />
              </Button>
            )}
            <TabsList className="grid grid-cols-3 gap-4 rounded-none w-full">
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
          </div>
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
