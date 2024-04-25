import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  if (props.note.segment) {
    return <SegmentNoteCard {...props} />;
  }
};

export const SegmentNoteCard = (props: {
  note: NoteType;
  onEdit?: (note: NoteType) => void;
}) => {
  const { note } = props;

  return (
    <div id={`note-${note.id}`} className="w-full rounded px-4 py-2 bg-muted/50">
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

        <NoteActionsDropdownMenu {...props} />
      </div>
    </div>
  );
};

const NoteActionsDropdownMenu = (props: {
  note: NoteType;
  onEdit?: (note: NoteType) => void;
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { note, onEdit } = props;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    EnjoyApp.notes.delete(note.id);
  };

  return (
    <>
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

          <DropdownMenuItem onClick={() => setDeleting(true)}>
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleting} onOpenChange={(value) => setDeleting(value)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteNote")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureToDeleteThisNote")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleDelete}>{t("delete")}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
