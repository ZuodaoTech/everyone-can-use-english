import { useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import { ChevronLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@renderer/components/ui";
import uniq from "lodash/uniq";
import Mark from "mark.js";
import { Vocabulary } from "@renderer/components";

export const StoryViewer = (props: {
  story: Partial<StoryType> & Partial<CreateStoryParamsType>;
  marked?: boolean;
  meanings?: MeaningType[];
  setMeanings: (meanings: MeaningType[]) => void;
  pendingLookups?: Partial<LookupType>[];
  doc: any;
}) => {
  const navigate = useNavigate();
  const { story, marked, meanings = [], pendingLookups = [], doc } = props;
  if (!story || !doc) return null;

  const paragraphs: { terms: any[]; text: string }[][] = doc
    .paragraphs()
    .json();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    const marker = new Mark(ref.current);
    if (marked) {
      const words = uniq([
        ...meanings.map((m) => m.word),
        ...pendingLookups.map((l) => l.word),
      ]);
      if (words.length === 0) return;
      marker.mark(words, {
        separateWordSearch: false,
        caseSensitive: false,
        acrossElements: true,
      });
    } else {
      marker.unmark();
    }

    return () => {
      marker.unmark();
    };
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
          data-source-type="Story"
          data-source-id={story.id}
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
                if (sentence.text.match(/!\[\]\(\S+\)/g)) {
                  const [img] = sentence.text.match(/!\[\]\(\S+\)/g);
                  const src = img.replace(/!\[\]\(/g, "").replace(/\)/g, "");
                  return <img key={`paragraph-${i}-sentence-${j}`} src={src} />;
                } else {
                  return (
                    <span
                      className="sentence select-auto whitespace-normal"
                      key={`paragraph-${i}-sentence-${j}`}
                    >
                      {sentence.terms.map((term) => (
                        <>
                          {term.pre}
                          <Vocabulary
                            word={term.text}
                            context={sentence.text}
                          />
                          {term.post}
                        </>
                      ))}
                    </span>
                  );
                }
              })}
            </p>
          ))}
        </article>
      </div>
    </>
  );
};
