import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { PostAudio } from "./post-audio";

export const PostNote = (props: { note: NoteType }) => {
  const { note } = props;
  console.log(note);

  return (
    <div className="select-text">
      <div className="select-text mb-2">{note.content}</div>

      {note.segment && (
        <NoteSemgent
          segment={note.segment}
          wordIndices={note.parameters.wordIndices}
        />
      )}
    </div>
  );
};

const NoteSemgent = (props: {
  segment: SegmentType;
  wordIndices: number[];
}) => {
  const { segment, wordIndices = [] } = props;
  const caption: TimelineEntry = segment.caption;

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
              className={`font-serif text-lg xl:text-xl 2xl:text-2xl cursor-pointer p-1 ${
                wordIndices.includes(index)
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
          </div>
        ))}
      </div>

      {segment.url && <PostAudio audio={{ sourceUrl: segment.url }} />}
    </>
  );
};
