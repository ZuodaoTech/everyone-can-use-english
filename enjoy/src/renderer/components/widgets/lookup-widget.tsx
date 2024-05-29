import { useEffect, useContext, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
  ScrollArea,
  Separator,
  toast,
} from "@renderer/components/ui";
import { useAiCommand, useCamdict } from "@renderer/hooks";
import { LoaderIcon, Volume2Icon } from "lucide-react";
import { t } from "i18next";
import { md5 } from "js-md5";

export const LookupWidget = () => {
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    word: string;
    context?: string;
    sourceType?: string;
    sourceId?: string;
    position: {
      x: number;
      y: number;
    };
  }>();

  const handleSelectionChanged = (position: { x: number; y: number }) => {
    const selection = document.getSelection();
    if (!selection?.anchorNode?.parentElement) return;

    const word = selection
      .toString()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]+$/, "");
    if (!word) return;
    // can only lookup single word
    if (word.indexOf(" ") > -1) return;

    const context = selection.anchorNode.parentElement
      .closest(".sentence, h2, p, div")
      ?.textContent?.trim();

    const sourceType = selection.anchorNode.parentElement
      .closest("[data-source-type]")
      ?.getAttribute("data-source-type");
    const sourceId = selection.anchorNode.parentElement
      .closest("[data-source-id]")
      ?.getAttribute("data-source-id");

    setSelected({ word, context, position, sourceType, sourceId });
    setOpen(true);
  };

  useEffect(() => {
    EnjoyApp.onLookup((_event, _selection, position) => {
      handleSelectionChanged(position);
    });

    return () => EnjoyApp.offLookup();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor
        className="absolute w-0 h-0"
        style={{
          top: selected?.position?.y,
          left: selected?.position?.x,
        }}
      ></PopoverAnchor>
      <PopoverContent
        className="w-full p-0 z-50"
        updatePositionStrategy="always"
      >
        {selected?.word && (
          <ScrollArea className="py-2 w-96 h-96 relative">
            <div className="px-4 pb-2 mb-2 font-bold text-lg sticky top-0 bg-background border-b">
              {selected?.word}
            </div>
            <div className="px-4">
              {learningLanguage.startsWith("en") && (
                <>
                  <CamdictLookupResult word={selected?.word} />
                  <Separator className="my-2" />
                </>
              )}
              <AiLookupResult
                word={selected?.word}
                context={selected?.context}
                sourceId={selected?.sourceId}
                sourceType={selected?.sourceType}
              />
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export const AiLookupResult = (props: {
  word: string;
  context?: string;
  sourceType?: string;
  sourceId?: string;
}) => {
  const { word, context = "", sourceType, sourceId } = props;
  const { webApi, EnjoyApp } = useContext(AppSettingsProviderContext);

  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const [result, setResult] = useState<LookupType>();
  const { lookupWord } = useAiCommand();

  const handleLookup = async (options?: { force: boolean }) => {
    if (lookingUp) return;
    if (!word) return;
    const { force = false } = options || {};

    setLookingUp(true);
    lookupWord({
      word,
      context,
      sourceId,
      sourceType,
      cacheKey: `lookup-${md5(`${word}-${context}`)}`,
      force,
    })
      .then((lookup) => {
        if (lookup?.meaning) {
          setResult(lookup);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLookingUp(false);
      });
  };

  const fetchCachedLookup = async () => {
    const remoteLookup = await webApi.lookup({
      word,
      context,
      sourceId,
      sourceType,
    });
    if (remoteLookup?.meaning) {
      setResult(remoteLookup);
      return;
    }

    const cached = await EnjoyApp.cacheObjects.get(
      `lookup-${md5(`${word}-${context}`)}`
    );
    if (cached?.meaning) {
      setResult(cached);
      return;
    }

    setResult(undefined);
  };

  /*
   * Fetch cached lookup result.
   */
  useEffect(() => {
    if (!word) return;

    fetchCachedLookup();
  }, [word, context]);

  if (!word) return null;

  return (
    <>
      <div className="text-sm italic text-muted-foreground mb-2">
        {t("aiDictionary")}
      </div>
      {result ? (
        <>
          <div className="mb-4 select-text">
            <div className="mb-2 font-semibord font-serif">{word}</div>
            <div className="mb-2">
              {result.meaning?.pos && (
                <span className="italic text-sm text-muted-foreground mr-2">
                  {result.meaning.pos}
                </span>
              )}
              {result.meaning?.pronunciation && (
                <span className="text-sm font-code mr-2">
                  /{result.meaning.pronunciation.replaceAll("/", "")}/
                </span>
              )}
              {result.meaning?.lemma &&
                result.meaning.lemma !== result.meaning.word && (
                  <span className="text-sm">({result.meaning.lemma})</span>
                )}
            </div>
            <div className="text-serif">{result.meaning.translation}</div>
            <div className="text-serif">{result.meaning.definition}</div>
          </div>
          <div className="flex items-center">
            <Button
              className="cursor-pointer"
              variant="secondary"
              size="sm"
              disabled={lookingUp}
              onClick={() => handleLookup({ force: true })}
              asChild
            >
              <a>
                {lookingUp && (
                  <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
                )}
                {t("reLookup")}
              </a>
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center space-x-2 py-2">
          <Button
            className="cursor-pointer"
            size="sm"
            asChild
            onClick={() => handleLookup()}
          >
            <a>
              {lookingUp && (
                <LoaderIcon className="animate-spin w-4 h-4 mr-2" />
              )}
              <span>{t("aiLookup")}</span>
            </a>
          </Button>
        </div>
      )}
    </>
  );
};

export const CamdictLookupResult = (props: { word: string }) => {
  const { word } = props;
  const { result } = useCamdict(word);

  if (!word) return null;

  return (
    <>
      <div className="text-sm italic text-muted-foreground mb-2">
        {t("cambridgeDictionary")}
      </div>
      {result ? (
        <div className="select-text">
          <div className="mb-2 font-semibord font-serif">{word}</div>
          {result.posItems.map((posItem, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-center space-x-4 mb-2 flex-wrap">
                <div className="italic text-sm text-muted-foreground">
                  {posItem.type}
                </div>

                {posItem.pronunciations.map((pron, i) => (
                  <div
                    key={`pron-${i}`}
                    className="flex items-center space-x-2"
                  >
                    <span className="uppercase text-xs font-serif text-muted-foreground">
                      [{pron.region}]
                    </span>
                    <span className="text-sm font-code">
                      /{pron.pronunciation}/
                    </span>
                    {pron.audio && pron.audio.match(/\.mp3/i) && (
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full p-0 w-6 h-6"
                          onClick={() => {
                            const audio = new Audio(pron.audio);
                            audio.play();
                          }}
                        >
                          <Volume2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <ul className="list-disc pl-4">
                {posItem.definitions.map((def, i) => (
                  <li key={`pos-${i}`} className="">
                    {def.definition}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm font-serif text-muted-foreground py-2 text-center">
          - {t("noResultsFound")} -
        </div>
      )}
    </>
  );
};
