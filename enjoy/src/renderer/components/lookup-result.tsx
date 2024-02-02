import { useState, useEffect } from "react";
import { LoaderSpin, MeaningCard } from "@renderer/components";
import { Button, toast } from "@renderer/components/ui";
import { t } from "i18next";
import { XCircleIcon } from "lucide-react";
import { useAiCommand } from "@renderer/hooks";

export const LookupResult = (props: {
  word: string;
  context?: string;
  sourceId?: string;
  sourceType?: string;
  onResult?: (meaning: MeaningType) => void;
}) => {
  const { word, context, sourceId, sourceType, onResult } = props;
  const [result, setResult] = useState<LookupType>();
  const [loading, setLoading] = useState<boolean>(false);
  if (!word) return null;

  const { lookupWord } = useAiCommand();

  const processLookup = async () => {
    if (!word) return;
    if (loading) return;

    setLoading(true);
    lookupWord({
      word,
      context,
      sourceId,
      sourceType,
    })
      .then((lookup) => {
        if (lookup?.meaning) {
          setResult(lookup);
          onResult && onResult(lookup.meaning);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    processLookup();
  }, [word, context]);

  if (result?.meaning) {
    return (
      <div className="px-4 py-2">
        <MeaningCard meaning={result.meaning} lookup={result} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-2">
        <div className="font-bold">{word}</div>
        <LoaderSpin />
      </div>
    );
  }

  if (result?.status === "failed") {
    return (
      <div className="px-4 py-2">
        <div className="font-bold">{word}</div>
        <div className="h-full w-full px-4 py-4 flex justify-center items-center">
          <div className="flex items-center justify-center mb-2">
            <XCircleIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {t("pleaseTryLater")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="font-bold mb-4">{word}</div>
      <div className="flex justify-center">
        <Button onClick={processLookup} variant="default" size="sm">
          {t("retry")}
        </Button>
      </div>
    </div>
  );
};
