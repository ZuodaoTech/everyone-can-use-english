import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useState, useContext, useEffect } from "react";
import { LoaderSpin, MeaningCard } from "@renderer/components";
import { Button } from "@renderer/components/ui";
import { t } from "i18next";
import { XCircleIcon } from "lucide-react";
import { toast } from "@renderer/components/ui";
import { lookupCommand } from "@commands";

export const LookupResult = (props: {
  word: string;
  context?: string;
  sourceId?: string;
  sourceType?: string;
  onResult?: (meaning: MeaningType) => void;
}) => {
  const { word, context, sourceId, sourceType, onResult } = props;
  const [result, setResult] = useState<LookupType>();
  const [loading, setLoading] = useState<boolean>(true);
  if (!word) return null;

  const { webApi } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);

  const processLookup = async () => {
    if (!word) return;
    if (!loading) return;

    setLoading(true);
    const lookup = await webApi.lookup({
      word,
      context,
      sourceId,
      sourceType,
    });

    if (lookup.meaning) {
      setResult(lookup);
      setLoading(false);
      onResult && onResult(lookup.meaning);
    } else {
      if (!openai?.key) {
        toast.error(t("openaiApiKeyRequired"));
        return;
      }

      lookupCommand(
        {
          word,
          context,
          meaningOptions: lookup.meaningOptions,
        },
        {
          key: openai.key,
          modelName: openai.model,
          baseUrl: openai.baseUrl,
        }
      )
        .then((res) => {
          if (res.context_translation?.trim()) {
            webApi
              .updateLookup(lookup.id, {
                meaning: res,
                sourceId,
                sourceType,
              })
              .then((lookup) => {
                setResult(lookup);
                onResult && onResult(lookup.meaning);
              });
          }
        })
        .catch((err) => {
          toast.error(`${t("lookupFailed")}: ${err.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
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
