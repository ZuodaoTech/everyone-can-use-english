import { useEffect, useState } from "react";
import { MarkdownWrapper } from "@renderer/components";
import { makeBook } from "foliate-js/view.js";
import { EPUB } from "foliate-js/epub.js";
import { blobToDataUrl } from "@renderer/lib/utils";
import Turndown from "turndown";

export const DocumentEpubRenderer = (props: { document: DocumentEType }) => {
  const { document } = props;
  const [book, setBook] = useState<typeof EPUB>();
  const [content, setContent] = useState<string>();
  const [position, setPosition] = useState<{
    section: number;
    paragraph: number;
  }>({
    section: 7,
    paragraph: 0,
  });
  const [section, setSection] = useState<typeof Document>();

  const renderCurrentSection = async () => {
    const sectionDoc = await book.sections[position.section].createDocument();

    for (const img of sectionDoc.body.querySelectorAll("img")) {
      const image = book.resources.manifest.find(
        (resource: any) => resource.id === img.id
      );
      if (!image) continue;

      const blob = new Blob([await book.loadBlob(image.href)], {
        type: image.mediaType,
      });
      const url = await blobToDataUrl(blob);
      img.setAttribute("src", url);
    }

    const markdownContent = new Turndown().turndown(sectionDoc.body.innerHTML);
    setContent(markdownContent);
  };

  useEffect(() => {
    makeBook(document.src).then((epub: typeof EPUB) => {
      setBook(epub);
    });
  }, [document.src]);

  useEffect(() => {
    if (!book) return;
    renderCurrentSection();
  }, [book]);

  return (
    <div className="select-text p-4 rounded-lg border">
      <MarkdownWrapper>{content}</MarkdownWrapper>
    </div>
  );
};
