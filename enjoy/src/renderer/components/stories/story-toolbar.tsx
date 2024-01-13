import {
  Alert,
  AlertTitle,
  AlertDescription,
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
  ScrollArea,
  Separator,
  Sheet,
  SheetHeader,
  SheetContent,
  FloatingToolbar,
  ToolbarButton,
} from "@renderer/components/ui";
import { MeaningCard, NoRecordsFound, LoaderSpin } from "@renderer/components";
import { useState } from "react";
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
  pendingLookups?: LookupType[];
  handleShare?: () => void;
}) => {
  const {
    starred,
    toggleStarred,
    extracted,
    scanning,
    onScan,
    marked,
    toggleMarked,
    meanings = [],
    pendingLookups = [],
    handleShare,
  } = props;

  const [vocabularyVisible, setVocabularyVisible] = useState<boolean>(
    !extracted
  );

  return (
    <>
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

      <Sheet
        open={!!vocabularyVisible}
        onOpenChange={(value) => {
          if (!value) setVocabularyVisible(null);
        }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl shadow-lg h-5/6">
          <SheetHeader className="flex items-center justify-center mb-2">
            <div className="text-center">
              <span className="font-semibold text-xl capitalize">
                {t("keyVocabulary")}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                ({meanings.length})
              </span>
            </div>
          </SheetHeader>
          <div className="w-full max-w-prose mx-auto h-full overflow-hidden px-4">
            <ScrollArea className="h-full pb-12">
              {extracted ? (
                <>
                  {pendingLookups.length > 0 && (
                    <Alert className="mb-4">
                      <LoaderIcon className="w-5 h-5 text-muted-foreground animate-spin" />
                      <AlertTitle>{t("lookingUp")}</AlertTitle>
                      <AlertDescription>
                        {t("thereAreLookupsPending", {
                          count: pendingLookups.length,
                        })}
                      </AlertDescription>
                    </Alert>
                  )}

                  {meanings.length > 0 ? (
                    meanings.map((meaning) => (
                      <div key={meaning.id} className="">
                        <MeaningCard meaning={meaning} />
                        <Separator className="my-4" />
                      </div>
                    ))
                  ) : (
                    <NoRecordsFound />
                  )}
                </>
              ) : (
                <LoaderSpin />
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
