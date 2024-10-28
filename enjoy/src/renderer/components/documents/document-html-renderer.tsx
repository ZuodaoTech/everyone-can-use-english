import { Readability } from "@mozilla/readability";
import { useEffect, useState } from "react";
import { convert } from "html-to-text";
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
    const markdownContent = convert(article.content, {
      wordwrap: false,
      selectors: [
        {
          selector: "a",
          options: {
            hideLinkHrefIfSameAsText: true,
            ignoreHref: true,
          },
        },
        {
          selector: "img",
          options: {
            ignoreImageAlt: true,
          },
        },
      ],
    });
    setContent(markdownContent);
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
