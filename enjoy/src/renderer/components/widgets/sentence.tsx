import { Vocabulary } from "@renderer/components";
import { cn } from "@renderer/lib/utils";

export const Sentence = ({
  sentence,
  className,
}: {
  sentence: string;
  className?: string;
}) => {
  let words = sentence.split(" ");

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
            {index === words.length - 1 ? " " : " "}
          </span>
        );
      })}
    </span>
  );
};
