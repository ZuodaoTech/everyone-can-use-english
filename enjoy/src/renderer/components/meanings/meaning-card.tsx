import { t } from "i18next";
import { useState } from "react";
import { Button } from "@renderer/components/ui";
import { ChevronDown, ChevronUp } from "lucide-react";

export const MeaningCard = (props: {
  meaning: MeaningType;
  lookup?: LookupType;
}) => {
  const {
    meaning: {
      word,
      lemma,
      pronunciation,
      pos,
      definition,
      translation,
      lookups: _lookups = [],
    },
    lookup,
  } = props;
  const [contextVisible, setContextVisible] = useState<boolean>(false);
  const lookups = [lookup, ..._lookups].filter(Boolean);

  return (
    <div className="select-text ">
      <div className="font-bold mb-2">{word}</div>
      <div className="mb-2">
        {pos && (
          <span className="italic text-sm text-muted-foreground mr-2">
            {pos}
          </span>
        )}
        {pronunciation && (
          <span className="text-sm font-code mr-2">/{pronunciation}/</span>
        )}
        {lemma && lemma !== word && <span className="text-sm">({lemma})</span>}
      </div>
      {translation && <div className="mb-2">{translation}</div>}
      <div className="mb-4">
        <span>{definition}</span>
      </div>

      {lookups && lookups.length > 0 && contextVisible && (
        <>
          {lookups.map((lookup) => (
            <ContextPart
              key={lookup.id}
              context={lookup.context}
              contextTranslation={lookup.contextTranslation}
            />
          ))}
        </>
      )}
      {lookups && lookups.length > 0 && (
        <div className="flex items-center justify-center">
          <Button
            onClick={() => setContextVisible(!contextVisible)}
            variant="ghost"
            size="sm"
            className="h-5"
          >
            {contextVisible ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const ContextPart = (props: {
  context: string;
  contextTranslation: string;
}) => {
  const { context, contextTranslation } = props;
  return (
    <div className="text-sm mb-4">
      <div className="uppercase font-semibold my-2">{t("context")}:</div>
      <div className="mb-2 text-muted-foreground">{context}</div>
      <div className="">{contextTranslation}</div>
    </div>
  );
};
