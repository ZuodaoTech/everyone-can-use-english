import { cn } from "@renderer/lib/utils";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  AlertDialogFooter,
} from "@renderer/components/ui";
import { MoreVerticalIcon, TrashIcon } from "lucide-react";
import { t } from "i18next";
import { useState } from "react";

export const DocumentCard = (props: {
  document: DocumentEType;
  className?: string;
}) => {
  const { document, className } = props;
  const [deleting, setDeleting] = useState(false);
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleting(true);
  };
  return (
    <div className={cn("w-full hover:scale-105 transition-all", className)}>
      <Link to={`/documents/${document.id}`}>
        <div className="aspect-[3/4] rounded overflow-hidden shadow-md relative flex flex-col">
          {/* Book body */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, #${document.md5.slice(
                0,
                6
              )}22, #${document.md5.slice(-6)}44)`,
            }}
          ></div>

          {/* Book spine */}
          <div
            className="absolute left-0 top-0 bottom-0 w-4 shadow-inner"
            style={{
              backgroundColor: `#${document.md5.slice(0, 6)}`,
            }}
          ></div>

          {/* Book title */}
          <div className="relative flex-grow flex items-center justify-center py-4 pl-6 pr-4 z-10">
            <h3 className="text-center font-bold text-gray-800 break-words overflow-hidden">
              {document.title}
            </h3>
          </div>
          {/* drop menu */}
          <div className="absolute right-1 top-1 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent w-6 h-6"
                >
                  <MoreVerticalIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleDelete}>
                  <TrashIcon className="w-4 h-4 text-destructive" />
                  <span className="ml-2 text-destructive text-sm">
                    {t("delete")}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Link>
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline">{t("cancel")}</Button>
            <Button variant="destructive">{t("delete")}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
