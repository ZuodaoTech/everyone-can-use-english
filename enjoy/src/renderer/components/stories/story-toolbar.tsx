import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
  FloatingToolbar,
  ToolbarButton,
} from "@renderer/components/ui";
import {
  HighlighterIcon,
  ScanTextIcon,
  LoaderIcon,
  StarIcon,
  Share2Icon,
} from "lucide-react";
import { t } from "i18next";

export const StoryToolbar = (props: {
  extracted: boolean;
  starred?: boolean;
  toggleStarred?: () => void;
  vocabulary?: {
    word: string;
    context: string;
    sourceId: string;
    sourceType: string;
  }[];
  scanning?: boolean;
  onScan?: () => void;
  meanings?: MeaningType[];
  marked?: boolean;
  toggleMarked?: () => void;
  handleShare?: () => void;
  vocabularyVisible: boolean;
  setVocabularyVisible?: (value: boolean) => void;
}) => {
  const {
    starred,
    toggleStarred,
    scanning,
    onScan,
    marked,
    toggleMarked,
    handleShare,
    vocabularyVisible,
    setVocabularyVisible,
  } = props;

  return (
    <FloatingToolbar>
      <ToolbarButton
        disabled={scanning}
        toggled={vocabularyVisible}
        onClick={() => {
          onScan();
          setVocabularyVisible(!vocabularyVisible);
        }}
      >
        {scanning ? (
          <LoaderIcon className="w-6 h-6 animate-spin" />
        ) : (
          <ScanTextIcon className="w-6 h-6" />
        )}
      </ToolbarButton>
      <ToolbarButton toggled={marked} onClick={toggleMarked}>
        <HighlighterIcon className="w-6 h-6" />
      </ToolbarButton>
      <ToolbarButton toggled={starred} onClick={toggleStarred}>
        <StarIcon className="w-6 h-6" />
      </ToolbarButton>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <ToolbarButton toggled={false} onClick={toggleStarred}>
            <Share2Icon className="w-6 h-6" />
          </ToolbarButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shareStory")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("areYouSureToShareThisStoryToCommunity")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction>
              <Button onClick={handleShare}>{t("share")}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FloatingToolbar>
  );
};
