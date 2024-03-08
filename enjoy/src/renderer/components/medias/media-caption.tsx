import { useEffect, useState, useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import { secondsToTimestamp } from "@renderer/lib/utils";
import cloneDeep from "lodash/cloneDeep";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";

export const MediaCaption = () => {
  const {
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
  const caption = transcription?.result?.[currentSegmentIndex];

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
      } else {
        const region = regions.addRegion({
          id: `word-region-${index}`,
          start: Math.min(start, regionStart),
          end: Math.max(end, regionEnd),
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

    const time = Math.round(currentTime * 1000);
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
        w.offsets.from / 1000 >= activeRegion.start &&
        w.offsets.to / 1000 <= activeRegion.end
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
          from: Math.round(from * 1000),
          to: Math.round(to * 1000),
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
        const firstWord =
          draft[currentSegmentIndex].segments[
            cloneDeep(selectedIndices).shift()
          ];
        const lastWord =
          draft[currentSegmentIndex].segments[cloneDeep(selectedIndices).pop()];

        firstWord.offsets.from = offsets.from;
        lastWord.offsets.to = offsets.to;
        firstWord.timestamps.from = timestamps.from;
        lastWord.timestamps.to = timestamps.to;

        setTranscriptionDraft(draft);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [editingRegion]);

  if (!caption) return <div></div>;

  return (
    <div className="p-4">
      <div className="flex-1 font-serif">
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
    </div>
  );
};
