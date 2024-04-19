import { LanguagesIcon } from "lucide-react";
import { Button } from "@renderer/components/ui";
import { LookupResult } from "@renderer/components";
import { useState } from "react";

export const SelectionMenu = (props: {
  word: string;
  context?: string;
  sourceId?: string;
  sourceType?: string;
  onLookup?: (meaning: MeaningType) => void;
}) => {
  const { word, context, sourceId, sourceType, onLookup } = props;
  const [translating, setTranslating] = useState(false);

  if (!word) return null;

  if (translating) {
    return (
      <LookupResult
        word={word}
        context={context}
        sourceId={sourceId}
        sourceType={sourceType}
        onResult={onLookup}
      />
    );
  }

  return (
    <div className="flex items-center">
      <Button onClick={() => setTranslating(true)} variant="ghost" size="icon">
        <LanguagesIcon size={16} />
      </Button>
    </div>
  );
};
