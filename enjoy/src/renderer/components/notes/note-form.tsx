import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useRef, useState } from "react";
import { Button, Textarea, toast } from "@renderer/components/ui";
import { t } from "i18next";

export const NoteForm = (props: {
  segment: SegmentType;
  note?: NoteType;
  parameters: { quoteIndices: number[]; quote: string };
  onParametersChange?: (parameters: any) => void;
  onCancel?: () => void;
  onSave?: (note: NoteType) => void;
}) => {
  const { segment, note, parameters, onParametersChange, onCancel, onSave } =
    props;
  const [content, setContent] = useState<string>(note?.content ?? "");
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    if (!inputRef.current) return;

    inputRef.current.style.height = "auto";
    inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
  };

  const handleSubmit = () => {
    if (!content) return;

    if (note) {
      EnjoyApp.notes
        .update(note.id, {
          content,
          parameters,
        })
        .then((note) => {
          onSave && onSave(note);
        })
        .catch((err) => {
          toast.error(err.message);
        });
    } else {
      EnjoyApp.notes
        .create({
          targetId: segment.id,
          targetType: "Segment",
          parameters,
          content,
        })
        .then((note) => {
          onSave && onSave(note);
          setContent("");
        })
        .catch((err) => {
          toast.error(err.message);
        });
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [content]);

  useEffect(() => {
    if (!note) return;
    if (note.parameters === parameters) return;

    onParametersChange && onParametersChange(note.parameters);
  }, [note]);

  return (
    <div className="w-full">
      <div className="mb-2">
        <Textarea
          ref={inputRef}
          className="w-full"
          value={content}
          placeholder={t("writeNoteHere")}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between">
        {parameters.quoteIndices?.length > 0 ? (
          <div className="flex space-x-2">
            <span className="text-sm px-1 rounded text-muted-foreground border-b border-red-500 border-dashed">
              {parameters.quoteIndices
                .map(
                  (index: number) => segment?.caption?.timeline?.[index]?.text
                )
                .join(" ")}
            </span>
          </div>
        ) : (
          <div></div>
        )}
        <div className="flex space-x-2">
          {note && (
            <Button variant="secondary" size="sm" onClick={onCancel}>
              {t("cancel")}
            </Button>
          )}
          <Button disabled={!content} size="sm" onClick={handleSubmit}>
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
};
