import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from "@/renderer/components/ui";
import { UninstallDictList } from ".";
import { t } from "i18next";

export const DictImportButton = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = (value: boolean) => {
    setOpen(value);
  };

  const handleDownload = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("import")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importDict")}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-72 pr-3">
          <UninstallDictList onDownload={handleDownload} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
