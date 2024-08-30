import { useEffect, useContext, useState } from "react";
import {
  AppSettingsProviderContext,
  DictProviderContext,
} from "@renderer/context";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
  ScrollArea,
} from "@renderer/components/ui";
import {
  DictLookupResult,
  DictSelect,
  AiLookupResult,
  CamdictLookupResult,
} from "@renderer/components";
import { ChevronLeft, ChevronFirst } from "lucide-react";

export const LookupWidget = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentDictValue } = useContext(DictProviderContext);
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
  const [history, setHistory] = useState<string[]>([]);
  const [current, setCurrent] = useState("");

  const handleSelectionChanged = (
    _word: string,
    _context: string,
    position: { x: number; y: number }
  ) => {
    let word = _word;
    let context = _context;
    let sourceType;
    let sourceId;

    const selection = document.getSelection();

    if (!word) {
      if (!selection?.anchorNode?.parentElement) return;

      word = selection
        .toString()
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]+$/, "");

      // can only lookup single word
      if (!word || word.indexOf(" ") > -1) return;
    }

    if (!context) {
      context = selection?.anchorNode.parentElement
        .closest(".sentence, h2, p, div")
        ?.textContent?.trim();
      sourceType = selection?.anchorNode.parentElement
        .closest("[data-source-type]")
        ?.getAttribute("data-source-type");
      sourceId = selection?.anchorNode.parentElement
        .closest("[data-source-id]")
        ?.getAttribute("data-source-id");
    }

    setSelected({ word, context, position, sourceType, sourceId });
    handleLookup(word);
    setOpen(true);
  };

  useEffect(() => {
    EnjoyApp.onLookup((_event, selection, context, position) => {
      handleSelectionChanged(selection, context, position);
    });

    return () => EnjoyApp.offLookup();
  }, []);

  function handleLookup(word: string) {
    setCurrent(word);
    setHistory([...history, word]);
  }

  function handleViewFirst() {
    setCurrent(history[0]);
    setHistory(history.slice(0, 1));
  }

  function handleViewLast() {
    setCurrent(history[history.length - 2]);
    setHistory(history.slice(0, -1));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor
        className="fixed w-0 h-0"
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
          <ScrollArea>
            <div className="w-96 h-96 flex flex-col">
              <div className="p-2 border-b flex justify-between items-center">
                <div className="flex items-center">
                  {history.length > 1 && (
                    <div className="mr-1 flex items-center">
                      <Button
                        variant="ghost"
                        className="w-6 h-6 p-0"
                        onClick={handleViewFirst}
                      >
                        <ChevronFirst />
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-6 h-6 p-0"
                        onClick={handleViewLast}
                      >
                        <ChevronLeft />
                      </Button>
                    </div>
                  )}

                  <div className="font-bold">{current}</div>
                </div>

                <div className="w-40">
                  <DictSelect />
                </div>
              </div>
              <div className="p-2 pr-1 flex-1">
                {currentDictValue === "ai" ? (
                  <AiLookupResult
                    word={selected?.word}
                    context={selected?.context}
                    sourceId={selected?.sourceId}
                    sourceType={selected?.sourceType}
                  />
                ) : currentDictValue === "cambridge" ? (
                  <CamdictLookupResult word={selected?.word} />
                ) : (
                  <DictLookupResult word={current} onJump={handleLookup} />
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};
