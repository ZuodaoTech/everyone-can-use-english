import { memo } from "react";
import { Vocabulary } from "@renderer/components";
import { cn } from "@renderer/lib/utils";

export const Sentence = memo(
  ({ sentence, className }: { sentence: string; className?: string }) => {
    // split by space or punctuation
    // Sentence may be in other languages, so need to handle only English words
    let words = sentence.split(/(\s+|[a-zA-Z]+)/);

    return (
      <span className={cn("break-words align-middle", className)}>
        {words.map((word, index) => {
          return (
            <span key={index}>
              {word.match(/[a-zA-Z]+/) ? (
                <Vocabulary word={word} context={sentence} />
              ) : (
                word
              )}
            </span>
          );
        })}
      </span>
    );
  }
);

Sentence.displayName = "Sentence";
