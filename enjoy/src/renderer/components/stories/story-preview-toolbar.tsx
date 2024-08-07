import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  FloatingToolbar,
  ToolbarButton,
} from "@renderer/components/ui";
import { BookOpenTextIcon, ScanTextIcon, HighlighterIcon } from "lucide-react";
import { t } from "i18next";

export const StoryPreviewToolbar = (props: {
  readable: boolean;
  onToggleReadable: () => void;
  onCreateStory: () => void;
  marked?: boolean;
  toggleMarked?: () => void;
}) => {
  const { readable, onCreateStory, onToggleReadable, marked, toggleMarked } =
    props;

  return (
    <FloatingToolbar>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <ToolbarButton
            toggled={false}
            tooltip={t("aiExtractVocabulary")}
            onClick={() => {}}
          >
            <ScanTextIcon className="w-6 h-6" />
          </ToolbarButton>
        </AlertDialogTrigger>
        <AlertDialogContent aria-describedby={undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("aiExtractVocabulary")}</AlertDialogTitle>

            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onCreateStory}>
                {t("continue")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
      <ToolbarButton
        toggled={readable}
        tooltip={t("toggleReadable")}
        onClick={onToggleReadable}
      >
        <BookOpenTextIcon className="w-6 h-6" />
      </ToolbarButton>
      <ToolbarButton toggled={marked} onClick={toggleMarked}>
        <HighlighterIcon className="w-6 h-6" />
      </ToolbarButton>
    </FloatingToolbar>
  );
};
