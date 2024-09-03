import { t } from "i18next";
import { useState, useEffect, useRef, useContext } from "react";
import { Button, ScrollArea, Separator } from "@renderer/components/ui";
import Mark from "mark.js";
import { useHotkeys } from "react-hotkeys-hook";
import { HotKeysSettingsProviderContext } from "@renderer/context";
import { Sentence } from "@renderer/components";

export const MeaningMemorizingCard = (props: { meaning: MeaningType }) => {
  const {
    meaning: { word, lookups },
  } = props;
  const { currentHotkeys, enabled } = useContext(
    HotKeysSettingsProviderContext
  );
  const [side, setSide] = useState<"front" | "back">("front");

  useEffect(() => {
    setSide("front");
  }, [word]);

  useHotkeys(
    [currentHotkeys.PlayOrPause],
    () => {
      document.getElementById("vocabulary-toggle-side-button").click();
    },
    {
      preventDefault: true,
    },
    [side]
  );

  if (side === "front")
    return (
      <FrontSide word={word} lookups={lookups} onFlip={() => setSide("back")} />
    );
  if (side === "back")
    return <BackSide meaning={props.meaning} onFlip={() => setSide("front")} />;
};

const FrontSide = (props: {
  word: string;
  lookups: LookupType[];
  onFlip: () => void;
}) => {
  const { word, lookups, onFlip } = props;
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    if (!ref.current) return;

    const mark = new Mark(ref.current);
    mark.mark([word], {
      separateWordSearch: false,
      caseSensitive: false,
      acrossElements: true,
    });

    return () => {
      mark.unmark();
    };
  }, [word, ref]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <h2 className="py-8 text-4xl font-bold font-serif text-center">
          {word}
        </h2>
        <div className="px-6">
          <div className="mb-4 italic text-sm">{t("context")}</div>
        </div>
        <div className="px-6 text-lg font-serif">
          <div ref={ref} className="">
            {lookups.map((lookup) => (
              <p key={lookup.id} className="mb-8">
                <Sentence sentence={lookup.context} />
              </p>
            ))}
          </div>
        </div>
      </ScrollArea>
      <div className="mt-4 flex items-center justify-center">
        <Button
          id="vocabulary-toggle-side-button"
          variant="default"
          onClick={onFlip}
        >
          {t("backSide")}
        </Button>
      </div>
    </div>
  );
};

const BackSide = (props: { meaning: MeaningType; onFlip: () => void }) => {
  const {
    meaning: {
      id,
      word,
      lemma,
      pronunciation,
      pos,
      definition,
      translation,
      lookups,
    },
    onFlip,
  } = props;

  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    if (!ref.current) return;

    const mark = new Mark(ref.current);
    mark.mark([word], {
      separateWordSearch: false,
      caseSensitive: false,
      acrossElements: true,
    });

    return () => {
      mark.unmark();
    };
  }, [id, ref]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1">
        <h2 className="py-8 text-4xl font-bold font-serif text-center">
          {word}
        </h2>
        <div className="px-6">
          <div className="mb-2">
            {pos && (
              <span className="italic text-sm text-muted-foreground mr-2">
                {pos}
              </span>
            )}
            {pronunciation && (
              <span className="text-sm mr-2">
                /{pronunciation.replaceAll("/", "")}/
              </span>
            )}
            {lemma && lemma !== word && (
              <span className="text-sm">({lemma})</span>
            )}
          </div>
          {translation && <div className="mb-2">{translation}</div>}
          <div className="mb-2">
            <span>{definition}</span>
          </div>

          <Separator className="my-6" />
          <div className="mb-4 italic text-sm">{t("context")}</div>
        </div>

        <div className="px-6 text-lg font-serif">
          <div ref={ref} className="">
            {lookups.map((lookup) => (
              <div key={lookup.id} className="mb-8">
                <Sentence sentence={lookup.context} />
                <div className="text-base mt-2">
                  {lookup.contextTranslation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="mt-4 flex items-center justify-center">
        <Button
          id="vocabulary-toggle-side-button"
          variant="secondary"
          onClick={onFlip}
        >
          {t("frontSide")}
        </Button>
      </div>
    </div>
  );
};
