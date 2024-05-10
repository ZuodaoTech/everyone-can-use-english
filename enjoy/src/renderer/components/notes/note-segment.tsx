import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { useState } from "react";
import { WavesurferPlayer } from "@/renderer/components/misc";

export const NoteSemgent = (props: {
  segment: SegmentType;
  notes: NoteType[];
}) => {
  const { segment, notes } = props;
  const caption: TimelineEntry = segment.caption;

  const [notedquoteIndices, setNotedquoteIndices] = useState<number[]>([]);

  let words = caption.text.split(" ");
  const ipas = caption.timeline.map((w) =>
    w.timeline.map((t) => t.timeline.map((s) => s.text))
  );

  if (words.length !== caption.timeline.length) {
    words = caption.timeline.map((w) => w.text);
  }

  return (
    <>
      <div className="flex flex-wrap p-2 rounded-t-lg bg-muted/50 mb-4">
        {/* use the words splitted by caption text if it is matched with the timeline length, otherwise use the timeline */}
        {words.map((word, index) => (
          <div
            className=""
            key={`note-segment-${segment.id}-${index}`}
            id={`note-segment-${segment.id}-${index}`}
          >
            <div
              className={`select-text font-serif text-lg xl:text-xl 2xl:text-2xl p-1 ${
                notedquoteIndices.includes(index)
                  ? "border-b border-red-500 border-dashed"
                  : ""
              }
          `}
            >
              {word}
            </div>

            <div
              className={`select-text text-sm 2xl:text-base text-muted-foreground font-code mb-1 ${
                index === 0 ? "before:content-['/']" : ""
              } ${
                index === caption.timeline.length - 1
                  ? "after:content-['/']"
                  : ""
              }`}
            >
              {ipas[index]}
            </div>

            {notes
              .filter((note) => note.parameters.quoteIndices?.[0] === index)
              .map((note) => (
                <div
                  key={`note-${segment.id}-${note.id}`}
                  className="mb-1 text-xs 2xl:text-sm text-red-500 max-w-64 line-clamp-3 font-code cursor-pointer"
                  onMouseOver={() =>
                    setNotedquoteIndices(note.parameters.quoteIndices)
                  }
                  onMouseLeave={() => setNotedquoteIndices([])}
                  onClick={() =>
                    document.getElementById("note-" + note.id)?.scrollIntoView()
                  }
                >
                  {note.parameters.quoteIndices[0] === index && note.content}
                </div>
              ))}
          </div>
        ))}
      </div>

      {segment.src && <WavesurferPlayer id={segment.id} src={segment.src} />}
    </>
  );
};
