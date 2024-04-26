import { NoteSemgent } from "@renderer/components";

export const PostNote = (props: { note: NoteType }) => {
  const { note } = props;

  return (
    <div className="select-text">
      <div className="select-text mb-2">{note.content}</div>
      {note.parameters?.quote && (
        <div className="mb-2">
          <span className="text-sm text-muted-foreground select-text border-b border-red-500 border-dashed">
            {note.parameters.quote}
          </span>
        </div>
      )}

      {note.segment && <NoteSemgent segment={note.segment} notes={[note]} />}
    </div>
  );
};
