import { AppSettingsProviderContext } from "@renderer/context";
import { useState, useContext, useEffect } from "react";
import { LoaderSpin, MeaningCard } from "@renderer/components";
import { Button } from "@renderer/components/ui";
import { t } from "i18next";
import { XCircleIcon } from "lucide-react";

export const LookupResult = (props: {
  word: string;
  context?: string;
  sourceId?: string;
  sourceType?: string;
  onResult?: (meaning: MeaningType) => void;
}) => {
  const { word, context, sourceId, sourceType, onResult } = props;
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const [result, setResult] = useState<LookupType>();
  const [loading, setLoading] = useState<boolean>(true);
  if (!word) return null;

  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const lookup = (retries = 0) => {
    if (!word) return;
    if (retries > 3) {
      setLoading(false);
      return;
    }

    retries += 1;
    EnjoyApp.webApi
      .lookup({
        word,
        context,
        sourceId,
        sourceType,
      })
      .then((res) => {
        if (res?.meaning) {
          setResult(res);
          setLoading(false);
          onResult && onResult(res.meaning);
        } else {
          // Retry after 1.5s
          const _timeout = setTimeout(() => {
            lookup(retries);
          }, 1500);
          setTimer(_timeout);
        }
      });
  };

  useEffect(() => {
    lookup();

    return () => {
      if (timer) clearTimeout(timer);
    };
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
        <Button
          onClick={() => {
            setLoading(true);
            lookup();
          }}
          variant="default"
          size="sm"
        >
          {t("retry")}
        </Button>
      </div>
    </div>
  );
};
