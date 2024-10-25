import { Readability } from "@mozilla/readability";
import { useEffect, useState } from "react";
import { MarkdownWrapper } from "@renderer/components";

export const DocumentHtmlRenderer = (props: { document: DocumentEType }) => {
  const { document } = props;
  const [content, setContent] = useState<string>();

  const fetchContent = async () => {
    const res = await fetch(document.src);
    const text = await res.text();
    console.log(text);
    const doc = new DOMParser().parseFromString(text, "text/html");
    const readability = new Readability(doc);
    const article = readability.parse();
    setContent(article.textContent);
  };

  useEffect(() => {
    fetchContent();
  }, [document.src]);

  return (
    <div className="">
      <MarkdownWrapper>{content}</MarkdownWrapper>
    </div>
  );
};
