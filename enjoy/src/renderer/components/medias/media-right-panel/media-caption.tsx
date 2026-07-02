import { useState, useContext, useEffect, useMemo } from "react";
import {
  AppSettingsProviderContext,
  MediaShadowProviderContext,
} from "@renderer/context";
import { convertWordIpaToNormal } from "@/utils";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";

// Convert katakana to hiragana (traditional furigana style)
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}


export const MediaCaption = (props: {
  caption: TimelineEntry;
  language?: string;
  selectedIndices?: number[];
  currentSegmentIndex: number;
  activeIndex?: number;
  displayIpa?: boolean;
  displayNotes?: boolean;
  onClick?: (index: number) => void;
}) => {
  const { currentNotes } = useContext(MediaShadowProviderContext);
  const { EnjoyApp, learningLanguage, ipaMappings } = useContext(
    AppSettingsProviderContext
  );
  const notes = currentNotes.filter((note) => note.parameters?.quoteIndices);
  const {
    caption,
    selectedIndices = [],
    currentSegmentIndex,
    activeIndex,
    displayIpa,
    displayNotes,
    onClick,
  } = props;
  const language = props.language || learningLanguage;

  const [notedquoteIndices, setNotedquoteIndices] = useState<number[]>([]);
  // Japanese word readings: maps word index → hiragana reading
  const [japaneseReadings, setJapaneseReadings] = useState<
    { surface: string; reading: string }[]
  >([]);

  useEffect(() => {
    if (!language.startsWith("ja") || !displayIpa) return;
    EnjoyApp.echogarden
      .getJapaneseReadings(caption.text)
      .then((tokens) => setJapaneseReadings(tokens))
      .catch(() => setJapaneseReadings([]));
  }, [caption.text, language, displayIpa]);

  let words = caption.text
    .replace(/ ([.,!?:;])/g, "$1")
    .replace(/ (['"")])/g, "$1")
    .replace(/ \.\.\./g, "...")
    .split(/([—]|\s+)/g)
    .filter((word) => word.trim() !== "" && word !== "—");

  const ipas = caption.timeline.map((w) =>
    w.timeline?.map((t) =>
      t.timeline && language.startsWith("en")
        ? convertWordIpaToNormal(
            t.timeline.map((s) => s.text),
            { mappings: ipaMappings }
          ).join("")
        : t.text
    )
  );

  if (words.length !== caption.timeline.length) {
    words = caption.timeline.map((w) => w.text);
  }

  // For Japanese: greedily match kuromoji tokens to each display word and
  // collect the hiragana reading. Sequential matching handles repeated words.
  const furiganaByIndex = useMemo(() => {
    if (!language.startsWith("ja") || japaneseReadings.length === 0) return [];
    let tokenIdx = 0;
    return words.map((word) => {
      let furigana = "";
      let remaining = word;
      while (remaining.length > 0 && tokenIdx < japaneseReadings.length) {
        const token = japaneseReadings[tokenIdx];
        if (remaining.startsWith(token.surface)) {
          furigana += katakanaToHiragana(token.reading);
          remaining = remaining.slice(token.surface.length);
          tokenIdx++;
        } else {
          break;
        }
      }
      return furigana;
    });
  }, [words, japaneseReadings, language]);

  return (
    <div className="flex flex-wrap px-4 py-2 bg-muted/50">
      {/* use the words splitted by caption text if it is matched with the timeline length, otherwise use the timeline */}
      {words.map((word, index) => (
        <div
          className=""
          key={`word-${currentSegmentIndex}-${index}`}
          id={`word-${currentSegmentIndex}-${index}`}
        >
          <div
            className={`font-serif xl:text-lg 2xl:text-xl px-1 ${
              onClick && "hover:bg-red-500/10 cursor-pointer"
            } ${index === activeIndex ? "text-red-500" : ""} ${
              selectedIndices.includes(index) ? "bg-red-500/10 selected" : ""
            } ${
              notedquoteIndices.includes(index)
                ? "border-b border-red-500 border-dashed"
                : ""
            }`}
            onClick={() => onClick && onClick(index)}
          >
            {word}
          </div>

          {displayIpa && language.startsWith("ja") ? (
            // Japanese: show hiragana furigana from kuromoji instead of
            // eSpeak phoneme text (which is garbled for kanji characters).
            furiganaByIndex[index] &&
            furiganaByIndex[index] !== words[index] ? (
              <div className="select-text text-xs text-muted-foreground px-1 text-center">
                {furiganaByIndex[index]}
              </div>
            ) : null
          ) : displayIpa ? (
            <div
              className={`select-text text-sm 2xl:text-base text-muted-foreground font-code px-1 ${
                index === 0 ? "before:content-['/']" : ""
              } ${
                index === caption.timeline.length - 1
                  ? "after:content-['/']"
                  : ""
              }`}
            >
              {ipas[index]}
            </div>
          ) : null}

          {displayNotes &&
            notes
              .filter((note) => note.parameters.quoteIndices[0] === index)
              .map((note) => (
                <div
                  key={`note-${currentSegmentIndex}-${note.id}`}
                  className="mb-1 text-xs 2xl:text-sm text-red-500 max-w-64 line-clamp-3 font-code cursor-pointer"
                  onMouseOver={() =>
                    setNotedquoteIndices(note.parameters.quoteIndices)
                  }
                  onMouseLeave={() => setNotedquoteIndices([])}
                  onClick={() =>
                    document.getElementById("note-" + note.id)?.scrollIntoView()
                  }
                >
                  {note.parameters.quoteIndices[0] === index && note.content}
                </div>
              ))}
        </div>
      ))}
    </div>
  );
};
