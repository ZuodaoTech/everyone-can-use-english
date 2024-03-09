import { useEffect, useState, useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import { secondsToTimestamp } from "@renderer/lib/utils";
import cloneDeep from "lodash/cloneDeep";
import { Button, toast } from "@renderer/components/ui";
import { t } from "i18next";
import {
  ChevronDownIcon,
  LanguagesIcon,
  PlayIcon,
  LoaderIcon,
  SpeechIcon,
} from "lucide-react";

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
    setTranscriptionDraft,
  } = useContext(MediaPlayerProviderContext);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [multiSelecting, setMultiSelecting] = useState<boolean>(false);
  const caption = transcription?.result?.[currentSegmentIndex];

  const toggleMultiSelect = (event: KeyboardEvent) => {
    setMultiSelecting(event.shiftKey && event.type === "keydown");
  };

  const toggleRegion = (index: number) => {
    if (!activeRegion) return;
    if (editingRegion) {
      toast.warning(t("currentRegionIsBeingEdited"));
      return;
    }

    const word = caption.segments[index];
    if (!word) return;

    const start = word.offsets.from / 1000;
    const end = word.offsets.to / 1000;
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

  useEffect(() => {
    if (!caption) return;

    const time = Math.round(currentTime * 1000.0);
    const index = caption.segments.findIndex(
      (w) => time >= w.offsets.from && time < w.offsets.to
    );

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [currentTime, caption]);

  useEffect(() => {
    if (!caption?.segments) return;
    if (!activeRegion) return;

    if (!activeRegion.id.startsWith("word-region")) {
      setSelectedIndices([]);
      return;
    }

    const indices: number[] = [];
    caption.segments.forEach((w, index) => {
      if (
        w.offsets.from / 1000.0 >= activeRegion.start &&
        (w.offsets.to / 1000.0 <= activeRegion.end ||
          w.offsets.to / 1000.0 > wavesurfer.getDuration())
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

        const from = region.start;
        const to = region.end;

        const offsets = {
          from: Math.round(from * 1000.0),
          to: Math.round(to * 1000.0),
        };

        const timestamps = {
          from: [
            secondsToTimestamp(from),
            Math.round((from * 1000) % 1000),
          ].join(","),
          to: [secondsToTimestamp(to), Math.round((to * 1000) % 1000)].join(
            ","
          ),
        };

        const draft = cloneDeep(transcription.result);
        const draftCaption = draft[currentSegmentIndex];

        const firstIndex = selectedIndices[0];
        const lastIndex = selectedIndices[selectedIndices.length - 1];
        const firstWord = draftCaption.segments[firstIndex];
        const lastWord = draftCaption.segments[lastIndex];

        console.log("firstWord", firstWord, "lastWord", lastWord);
        if (!firstWord) return;
        firstWord.offsets.from = offsets.from;
        lastWord.offsets.to = offsets.to;
        firstWord.timestamps.from = timestamps.from;
        lastWord.timestamps.to = timestamps.to;

        /* Update the offsets of the previous and next words
         * It happens only when regions are intersecting with the previous or next word.
         * It will ignore if the previous/next word's position changed in timestamps.
         */
        const prevWord = draftCaption.segments[firstIndex - 1];
        const nextWord = draftCaption.segments[lastIndex + 1];
        if (
          prevWord &&
          prevWord.offsets.to > offsets.from &&
          prevWord.offsets.from < offsets.from
        ) {
          prevWord.offsets.to = offsets.from;
          prevWord.timestamps.to = timestamps.from;
        }
        if (
          nextWord &&
          nextWord.offsets.from < offsets.to &&
          nextWord.offsets.to > offsets.to
        ) {
          nextWord.offsets.from = offsets.to;
          nextWord.timestamps.from = timestamps.to;
        }

        /*
         * If the last word is the last word of the segment, then update the segment's end time.
         */
        if (lastIndex === draftCaption.segments.length - 1) {
          draftCaption.offsets.to = offsets.to;
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
    <div className="flex justify-between h-[calc(70vh-28.5rem)] py-4">
      <div className="flex-1 px-4 py-2 flex-1 font-serif h-full">
        <div className="flex flex-wrap">
          {(caption.segments || []).map((w, index) => (
            <div
              key={index}
              className={`pr-1 cursor-pointer hover:bg-red-500/10 ${
                index === activeIndex ? "text-red-500" : ""
              } ${selectedIndices.includes(index) ? "bg-red-500/10" : ""}`}
              onClick={() => toggleRegion(index)}
            >
              <div className="text-2xl">{w.text}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedIndices.length > 0 && (
        <div className="w-56 rounded-lg shadow border px-4 py-2 mr-4">
          <div className="font-serif text-lg font-semibold tracking-tight">
            {selectedIndices
              .map((index) => caption.segments[index].text)
              .join(" ")}
          </div>
        </div>
      )}
      <div className="flex flex-col space-y-2">
        <Button variant="outline" size="icon" className="rounded-full">
          <LanguagesIcon className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-full">
          <SpeechIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
