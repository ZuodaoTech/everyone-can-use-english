import {
  Alert,
  AlertTitle,
  AlertDescription,
  ScrollArea,
  Separator,
  Sheet,
  SheetHeader,
  SheetContent,
} from "@renderer/components/ui";
import { MeaningCard, NoRecordsFound, LoaderSpin } from "@renderer/components";
import { LoaderIcon } from "lucide-react";
import { t } from "i18next";

export const StoryVocabularySheet = (props: {
  extracted: boolean;
  meanings?: MeaningType[];
  pendingLookups?: Partial<LookupType>[];
  vocabularyVisible?: boolean;
  setVocabularyVisible?: (value: boolean) => void;
}) => {
  const {
    extracted,
    meanings = [],
    pendingLookups = [],
    vocabularyVisible,
    setVocabularyVisible,
  } = props;

  return (
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
  );
};
