import { Vocabulary } from "@renderer/components";

export const Sentence = ({ sentence }: { sentence: string }) => {
  let words = sentence.split(" ");

  return (
    <span className="break-words align-middle">
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
