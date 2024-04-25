import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@renderer/components/ui";
import { MoreHorizontalIcon } from "lucide-react";
import Markdown from "react-markdown";
import { t } from "i18next";
import { formatDateTime } from "@/renderer/lib/utils";

export const NoteCard = (props: {
  note: NoteType;
  onEdit?: (note: NoteType) => void;
}) => {
  const { note, onEdit } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const handleDelete = () => {
    EnjoyApp.notes.delete(note.id);
  };

  return (
    <div id={`note-${note.id}`} className="w-full border rounded px-4 py-2">
      <Markdown className="prose prose-sm dark:prose-invert max-w-full mb-2">
        {note.content}
      </Markdown>

      <div className="flex justify-between space-x-2">
        {note.parameters?.wordIndices?.length ? (
          <div className="flex">
            <span className="text-muted-foreground text-sm bg-muted px-1 rounded">
              {note.parameters.wordIndices
                .map(
                  (index: number) =>
                    note.segment?.caption?.timeline?.[index]?.text
                )
                .join(" ")}
            </span>
          </div>
        ) : (
          <div></div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-4 h-4 p-0">
              <MoreHorizontalIcon className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit && onEdit(note)}>
              {t("edit")}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleDelete}>
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
