import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@renderer/components/ui";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { t } from "i18next";

export const PostOptions = (props: { handleDelete: () => void }) => {
  const { handleDelete } = props;
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreHorizontalIcon className="w-4 h-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setDeleting(true)}>
            <span className="text-sm mr-auto text-destructive capitalize">
              {t("delete")}
            </span>
            <Trash2Icon className="w-4 h-4 text-destructive" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeSharing")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureToRemoveThisSharing")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete();
                setDeleting(false);
              }}
            >
              {t("delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
