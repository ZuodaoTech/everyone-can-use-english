import { useEffect, useRef, useState } from "react";
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
  toast,
} from "@renderer/components/ui";
import { ChevronLeftIcon, ChevronRightIcon, MenuIcon } from "lucide-react";

export const DocumentEpubRenderer = (props: { document: DocumentEType }) => {
  const { document } = props;
  const [book, setBook] = useState<typeof EPUB>();
  const [content, setContent] = useState<string>();
  const [section, setSection] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [paragraph, setParagraph] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const ref = useRef<HTMLDivElement>(null);

  const renderCurrentSection = async () => {
    setLoading(true);

    try {
      const sectionDoc = await book.sections[section].createDocument();
      setTitle(sectionDoc.title);

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

      const markdownContent = new Turndown().turndown(
        sectionDoc.body.innerHTML
      );
      setContent(markdownContent);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevSection = () => {
    if (section === 0) return;
    if (!book) return;

    setSection(section - 1);
  };

  const handleNextSection = () => {
    if (section === book.sections.length - 1) return;
    if (!book) return;

    setSection(section + 1);
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    handleSectionClick(new URL(e.currentTarget.href).pathname);
    e.currentTarget.blur();
  };

  const handleSectionClick = (id: string) => {
    const sec = book.sections.findIndex((sec: any) => sec.id === id);
    if (sec === -1) return;

    setSection(sec);
  };

  useEffect(() => {
    makeBook(document.src).then((epub: typeof EPUB) => {
      setBook(epub);
      setLoading(false);
    });
  }, [document.src]);

  useEffect(() => {
    if (!book) return;

    (window as any).book = book;
    renderCurrentSection();
  }, [book, section]);

  // auto scroll to the top when new section is rendered
  useEffect(() => {
    if (!content) return;

    let anchor = ref.current?.querySelector(`#${paragraph}`);
    anchor ||= ref.current?.querySelector("#start-anchor");

    anchor?.scrollIntoView({
      behavior: "smooth",
    });
  }, [content]);

  if (!book) return <LoaderSpin />;

  return (
    <div ref={ref} className="select-text relative">
      <div className="flex items-center justify-between space-x-2 sticky top-0 z-10 bg-background py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6">
              <MenuIcon className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="w-64 max-h-96 overflow-y-auto"
          >
            {(book?.toc as any[]).map((item: any) => (
              <DropdownMenuItem
                className="cursor-pointer font-mono"
                key={item.id}
                onClick={() => handleSectionClick(item.href)}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="text-xs text-muted-foreground truncate">{title}</div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrevSection}
            variant="ghost"
            size="icon"
            className="w-6 h-6"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleNextSection}
            variant="ghost"
            size="icon"
            className="w-6 h-6"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div id="start-anchor" />
      {loading ? (
        <LoaderSpin />
      ) : (
        <MarkdownWrapper className="mx-auto" onLinkClick={handleLinkClick}>
          {content}
        </MarkdownWrapper>
      )}
    </div>
  );
};
