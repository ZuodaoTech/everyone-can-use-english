import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  toast,
} from "@renderer/components/ui";
import { MoreVerticalIcon } from "lucide-react";
import { t } from "i18next";
import { useContext } from "react";
import {
  AppSettingsProviderContext,
  DocumentProviderContext,
} from "@renderer/context";
import template from "./document.template.html?raw";

export const DocumentActionsButton = (props: { document: DocumentEType }) => {
  const { document } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { ref, section } = useContext(DocumentProviderContext);

  const handlePrint = async () => {
    if (!ref.current) return;

    const content = template.replace("$title", document.title).replace(
      "$content",
      Array.from(ref.current.querySelectorAll(".segment, .translation"))
        .map((segment) => {
          const tagName = segment.tagName.toLowerCase();
          if (segment.classList.contains("translation")) {
            return `<${tagName}>${segment.textContent}</${tagName}>`;
          }
          return `<${tagName}>${
            segment.querySelector(".segment-content")?.textContent
          }</${tagName}>`;
        })
        .join("")
    );

    try {
      const savePath = await EnjoyApp.dialog.showSaveDialog({
        title: t("print"),
        defaultPath: `${document.title}(S${section}).pdf`,
      });

      if (!savePath) return;

      await EnjoyApp.download.printAsPdf(content, savePath);

      toast.success(t("downloadedSuccessfully"));
    } catch (err) {
      toast.error(`${t("downloadFailed")}: ${err.message}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-6 h-6">
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuItem onClick={handlePrint}>{t("print")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
