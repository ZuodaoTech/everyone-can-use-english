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

export const NoteCard = (props: {
  note: NoteType;
  onEdit?: (note: NoteType) => void;
}) => {
  const { note, onEdit } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const handleDelete = () => {
    EnjoyApp.notes.delete(note.id);
  };

  return (
    <div id={`note-${note.id}`} className="w-full border rounded-lg p-4">
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex justify-between mb-2"
      >
        <span className="text-muted-foreground text-sm">
          {new Date(note.createdAt).toLocaleString()}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-6 h-6">
              <MoreHorizontalIcon className="w-5 h-5" />
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

      {collapsed ? (
        <div className="text-sm line-clamp-1">{note.content}</div>
      ) : (
        <Markdown className="prose-sm dark:prose-invert max-w-full">
          {note.content}
        </Markdown>
      )}

      {note.parameters?.wordIndices && (
        <div className="mt-2 flex">
          <span className="text-muted-foreground text-sm bg-muted px-1 rounded">
            {note.parameters.wordIndices
              .map(
                (index: number) =>
                  note.segment?.caption?.timeline?.[index]?.text
              )
              .join(" ")}
          </span>
        </div>
      )}
    </div>
  );
};
