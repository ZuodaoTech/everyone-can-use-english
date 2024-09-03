import { Vocabulary } from "@renderer/components";

export const Sentence = ({ sentence }: { sentence: string }) => {
  let words = sentence.split(" ");

  return (
    <span className="break-all align-middle">
      {words.map((word, index) => {
        return (
          <>
            <Vocabulary key={index} word={word} context={sentence} />
            {index === words.length - 1 ? " " : " "}
          </>
        );
      })}
    </span>
  );
};
