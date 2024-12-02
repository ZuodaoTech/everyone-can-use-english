import { useCallback, useContext, useEffect, useState } from "react";
import {
  DocumentActionsButton,
  DocumentConfigButton,
  LoaderSpin,
  MarkdownWrapper,
} from "@renderer/components";
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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  TableOfContentsIcon,
} from "lucide-react";
import {
  AppSettingsProviderContext,
  DocumentProviderContext,
} from "@renderer/context";

export const DocumentEpubRenderer = () => {
  const {
    ref,
    document,
    onSpeech,
    section,
    setSection,
    onSegmentVisible,
    content,
    setContent,
  } = useContext(DocumentProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const [book, setBook] = useState<typeof EPUB>();
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const refreshBookMetadata = () => {
    if (!book) return;

    if (document.title !== book.metadata.title) {
      EnjoyApp.documents.update(document.id, {
        title: book.metadata.title,
        language: book.metadata.language,
      });
    }
  };

  const renderCurrentSection = async () => {
    setLoading(true);

    try {
      const sectionDoc = await book.sections[section].createDocument();
      const tocItem = book.toc.find((item: any) => item.href === sectionDoc.id);
      setTitle(tocItem?.label || sectionDoc.title);

      for (const img of sectionDoc.body.querySelectorAll("img")) {
        let image: any;
        if (img.src) {
          image = book.resources.manifest.find((resource: any) =>
            resource.href.endsWith(new URL(img.src).pathname)
          );
        } else if (img.id) {
          image = book.resources.manifest.find(
            (resource: any) => resource.id === img.id
          );
        }
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

  const handleSectionClick = useCallback(
    (id: string) => {
      const sec = book.sections.findIndex((sec: any) => sec.id.endsWith(id));
      if (sec === -1) return;

      setSection(sec);
    },
    [book]
  );

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      handleSectionClick(new URL(e.currentTarget.href).pathname);
      e.currentTarget.blur();
    },
    [handleSectionClick]
  );

  useEffect(() => {
    makeBook(document.src).then((epub: typeof EPUB) => {
      setBook(epub);
      setLoading(false);
    });
  }, [document?.src]);

  useEffect(() => {
    if (!book) return;

    refreshBookMetadata();
    renderCurrentSection();
  }, [book, section]);

  if (!book) return <LoaderSpin />;

  return (
    <div className="select-text relative">
      <div className="flex items-center justify-between space-x-2 sticky top-0 z-10 bg-background py-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6">
                <TableOfContentsIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="start"
              className="w-64 max-h-96 overflow-y-auto"
            >
              {(book?.toc as any[]).map((item: any) => (
                <div key={item.href}>
                  <DropdownMenuItem
                    className="cursor-pointer text-sm"
                    key={item.href}
                    onClick={() => handleSectionClick(item.href)}
                  >
                    {item.label}
                  </DropdownMenuItem>
                  {(item.subitems || []).map((subitem: any) => (
                    <DropdownMenuItem
                      className="cursor-pointer pl-4 text-sm text-muted-foreground"
                      key={subitem.href}
                      onClick={() => handleSectionClick(subitem.href)}
                    >
                      {subitem.label}
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DocumentConfigButton document={document} />
          <DocumentActionsButton document={document} />
        </div>
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
        <MarkdownWrapper
          className="mx-auto max-w-full document-renderer"
          onLinkClick={handleLinkClick}
          onSegmentVisible={onSegmentVisible}
          autoTranslate={document.config.autoTranslate}
          onSpeech={onSpeech}
          translatable={true}
          section={section}
        >
          {content}
        </MarkdownWrapper>
      )}
    </div>
  );
};
