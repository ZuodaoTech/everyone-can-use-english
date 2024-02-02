import { useState, useEffect } from "react";
import nlp from "compromise";
import paragraphs from "compromise-paragraphs";
nlp.plugin(paragraphs);

export const StoryContent = (props: { content: string }) => {
  const { content } = props;
  if (!content) return null;

  const [paragraphs, setParagraphs] = useState<
    { terms: any[]; text: string }[][]
  >([]);
  const doc = nlp(content);
  doc.cache();

  useEffect(() => {
    setParagraphs(doc.paragraphs().json());
  }, [content.trim()]);

  return (
    <>
      {paragraphs.map((sentences, i: number) => (
        <p key={`paragraph-${i}`} className="">
          {sentences.map((sentence, i: number) => {
            if (sentence.text.match(/!\[\]\(\S+\)/g)) {
              const [img] = sentence.text.match(/!\[\]\(\S+\)/g);
              const src = img.replace(/!\[\]\(/g, "").replace(/\)/g, "");
              return (
                <p key={`paragraph-${i}`}>
                  <img src={src} />
                </p>
              );
            } else {
              return (
                <span
                  className="sentence select-auto whitespace-normal"
                  key={`sentence-${i}`}
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
    </>
  );
};
