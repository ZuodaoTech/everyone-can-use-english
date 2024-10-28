import { useEffect, useState } from "react";
import { LoaderSpin, MarkdownWrapper } from "@renderer/components";
import { makeBook } from "foliate-js/view.js";
import { EPUB } from "foliate-js/epub.js";
import { blobToDataUrl } from "@renderer/lib/utils";
import Turndown from "turndown";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from "@renderer/components/ui";
import { ChevronLeftIcon, ChevronRightIcon, MenuIcon } from "lucide-react";

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

  if (!book) return <LoaderSpin />;

  return (
    <div className="select-text relative">
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6">
              <MenuIcon className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>
              <span>Search</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-6 h-6">
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-6 h-6">
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {content ? <MarkdownWrapper>{content}</MarkdownWrapper> : <LoaderSpin />}
    </div>
  );
};
