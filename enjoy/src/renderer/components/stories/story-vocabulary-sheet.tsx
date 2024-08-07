import {
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetHeader,
  SheetContent,
} from "@renderer/components/ui";
import { MeaningCard, NoRecordsFound, LoaderSpin } from "@renderer/components";
import { LoaderIcon, LanguagesIcon } from "lucide-react";
import { t } from "i18next";

export const StoryVocabularySheet = (props: {
  extracted: boolean;
  meanings?: MeaningType[];
  pendingLookups?: Partial<LookupType>[];
  vocabularyVisible?: boolean;
  setVocabularyVisible?: (value: boolean) => void;
  lookingUpInBatch?: boolean;
  setLookupInBatch?: (value: boolean) => void;
  processLookup?: (lookup: Partial<LookupType>) => void;
  lookingUp?: boolean;
}) => {
  const {
    extracted,
    meanings = [],
    pendingLookups = [],
    vocabularyVisible,
    setVocabularyVisible,
    lookingUpInBatch,
    setLookupInBatch,
    processLookup,
    lookingUp,
  } = props;

  return (
    <Sheet
      open={!!vocabularyVisible}
      onOpenChange={(value) => {
        if (!value) setVocabularyVisible(null);
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl shadow-lg h-5/6"
        aria-describedby={undefined}
      >
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
          <ScrollArea className="h-full px-4 pb-12">
            {extracted ? (
              <>
                {pendingLookups.length > 0 && (
                  <Alert className="mb-4">
                    {lookingUpInBatch ? (
                      <>
                        <LoaderIcon className="w-5 h-5 text-muted-foreground animate-spin" />
                        <AlertTitle>{t("lookingUp")}</AlertTitle>
                        <AlertDescription className="flex items-start">
                          <div className="flex-1">
                            {t("thereAreLookupsPending", {
                              count: pendingLookups.length,
                            })}
                          </div>
                          <div className="">
                            <Button
                              variant="secondary"
                              onClick={() => setLookupInBatch(false)}
                              size="sm"
                            >
                              {t("cancel")}
                            </Button>
                          </div>
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <LanguagesIcon className="w-5 h-5" />
                        <AlertTitle>{t("pending")}</AlertTitle>
                        <AlertDescription className="flex items-start">
                          <div className="flex-1">
                            {t("thereAreLookupsPending", {
                              count: pendingLookups.length,
                            })}
                          </div>
                          <div className="">
                            <Button
                              variant="outline"
                              onClick={() => setLookupInBatch(true)}
                              size="sm"
                            >
                              {t("lookupAll")}
                            </Button>
                          </div>
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}

                {meanings.length > 0 &&
                  meanings.map((meaning) => (
                    <div key={meaning.id} className="">
                      <MeaningCard meaning={meaning} />
                      <Separator className="my-4" />
                    </div>
                  ))}

                {pendingLookups.length > 0 &&
                  pendingLookups.map((lookup) => (
                    <div key={lookup.id} className="">
                      <div className="flex items-center justify-between">
                        <div className="font-bold mb-2">{lookup.word}</div>
                        <Button
                          disabled={lookingUp}
                          onClick={() => processLookup(lookup)}
                          variant="secondary"
                          size="sm"
                        >
                          {t("lookup")}
                        </Button>
                      </div>
                      <div className="text-sm mb-2">
                        <div className="uppercase font-semibold my-2">
                          {t("context")}:
                        </div>
                        <div className="mb-2 text-muted-foreground">
                          {lookup.context}
                        </div>
                      </div>
                      <Separator className="my-4" />
                    </div>
                  ))}

                {meanings.length === 0 && pendingLookups.length === 0 && (
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
