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
            <Vocabulary key={index} word={word} context={sentence} />
            {index === words.length - 1 ? " " : " "}
          </span>
        );
      })}
    </span>
  );
};
