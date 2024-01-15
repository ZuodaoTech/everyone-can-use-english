import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import { ChevronLeftIcon, ExternalLinkIcon } from "lucide-react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@renderer/components/ui";
import { SelectionMenu } from "@renderer/components";
import { debounce , uniq } from "lodash";
import Mark from "mark.js";

export const StoryViewer = (props: {
  story: Partial<StoryType> & Partial<CreateStoryParamsType>;
  marked?: boolean;
  meanings?: MeaningType[];
  setMeanings: (meanings: MeaningType[]) => void;
  pendingLookups?: LookupType[];
  doc: any;
}) => {
  const navigate = useNavigate();
  const {
    story,
    marked,
    meanings = [],
    setMeanings,
    pendingLookups = [],
    doc,
  } = props;
  if (!story || !doc) return null;

  const paragraphs: { terms: any[]; text: string }[][] = doc
    .paragraphs()
    .json();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const ref = useRef<HTMLDivElement>();
  const [selected, setSelected] = useState<{
    word: string;
    context?: string;
    position?: {
      top: number;
      left: number;
    };
  }>();

  const handleSelectionChanged = debounce(() => {
    const selection = document.getSelection();
    const word = selection
      .toString()
      .trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, "");
    if (!word) return;

    const position = {
      top:
        selection.anchorNode.parentElement.offsetTop +
        selection.anchorNode.parentElement.offsetHeight,
      left: selection.anchorNode.parentElement.offsetLeft,
    };
    const context = selection.anchorNode.parentElement
      .closest("span.sentence, h2")
      ?.textContent?.trim();

    setSelected({ word, context, position });
  }, 500);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChanged);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChanged);
    };
  }, [story]);

  useEffect(() => {
    const words = uniq([
      ...meanings.map((m) => m.word),
      ...pendingLookups.map((l) => l.word),
    ]);
    if (words.length === 0) return;

    const marker = new Mark(ref.current);
    if (marked) {
      marker.mark(words, {
        separateWordSearch: false,
        caseSensitive: false,
        acrossElements: true,
      });
    } else {
      marker.unmark();
    }
  }, [meanings, pendingLookups, marked]);

  return (
    <>
      <div className="w-full max-w-2xl xl:max-w-3xl mx-auto sticky bg-background top-0 z-30 px-4 py-2 border-b">
        <div className="w-full flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (story.id) {
                navigate("/stories");
              } else {
                navigate(-1);
              }
            }}
          >
            <ChevronLeftIcon className="w-6 h-6 text-muted-foreground" />
          </Button>

          <div className="truncate flex-1 font-serif text-muted-foreground">
            {story.title}
          </div>

          <div
            onClick={() => {
              EnjoyApp.shell.openExternal(story.url);
            }}
            className="cursor-pointer flex items-center space-x-2"
          >
            {story.metadata?.favicon ? (
              <img src={story.metadata.favicon} className="h-6 w-auto" />
            ) : (
              <ExternalLinkIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
      <div className="bg-background py-6 px-8 max-w-2xl xl:max-w-3xl mx-auto relative shadow-lg">
        <article
          ref={ref}
          className="relative select-text prose dark:prose-invert prose-lg xl:prose-xl font-serif text-lg"
        >
          <h2>
            {story.title.split(" ").map((word, i) => (
              <span key={`title-word-${i}`} className="">
                {word}{" "}
              </span>
            ))}
          </h2>

          {paragraphs.map((sentences, i: number) => (
            <p key={`paragraph-${i}`} className="">
              {sentences.map((sentence, j: number) => {
                if (sentence.text.match(/\!\[\]\(\S+\)/g)) {
                  const [img] = sentence.text.match(/\!\[\]\(\S+\)/g);
                  const src = img.replace(/\!\[\]\(/g, "").replace(/\)/g, "");
                  return <img key={`paragraph-${i}-sentence-${j}`} src={src} />;
                } else {
                  return (
                    <span
                      className="sentence select-auto whitespace-normal"
                      key={`paragraph-${i}-sentence-${j}`}
                    >
                      {sentence.terms.map((term) => (
                        <span key={term.id} className="">
                          {term.pre}
                          {term.text}
                          {term.post}
                        </span>
                      ))}
                    </span>
                  );
                }
              })}
            </p>
          ))}

          <Popover
            open={Boolean(selected?.word)}
            onOpenChange={(value) => {
              if (!value) setSelected(null);
            }}
          >
            <PopoverAnchor
              className="absolute w-0 h-0"
              style={{
                top: selected?.position?.top,
                left: selected?.position?.left,
              }}
            ></PopoverAnchor>
            <PopoverContent
              className="w-full max-w-md p-0"
              updatePositionStrategy="always"
            >
              {selected?.word && (
                <SelectionMenu
                  word={selected?.word}
                  context={selected?.context}
                  sourceId={story.id}
                  sourceType={"Story"}
                  onLookup={(meaning) => {
                    if (setMeanings) {
                      setMeanings([...meanings, meaning]);
                    }
                  }}
                />
              )}
            </PopoverContent>
          </Popover>
        </article>
      </div>
    </>
  );
};
