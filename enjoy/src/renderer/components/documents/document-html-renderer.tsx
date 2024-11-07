import { Readability } from "@mozilla/readability";
import { useContext, useEffect, useState } from "react";
import { DocumentConfigButton, MarkdownWrapper } from "@renderer/components";
import Turndown from "turndown";
import {
  AppSettingsProviderContext,
  DocumentProviderContext,
} from "@/renderer/context";
import { Button } from "../ui";
import { LinkIcon } from "lucide-react";

export const DocumentHtmlRenderer = () => {
  const { ref, document, onSpeech, onParagraphVisible } = useContext(
    DocumentProviderContext
  );
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>();

  const fetchContent = async () => {
    const res = await fetch(document.src);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    setTitle(doc.title || document.title);
    const readability = new Readability(doc);
    const article = readability.parse();
    const markdownContent = new Turndown().turndown(article.content);
    setContent(markdownContent);
  };

  // auto scroll to the top when new section is rendered
  useEffect(() => {
    if (!content) return;
    if (!ref?.current) return;

    let anchor = ref.current?.querySelector(
      `[data-index="${document.lastReadPosition.paragraph || 0}"]`
    );

    anchor?.scrollIntoView({
      behavior: "smooth",
    });
  }, [content]);

  useEffect(() => {
    fetchContent();
  }, [document.src]);

  useEffect(() => {
    if (!title) return;

    if (document.title !== title) {
      EnjoyApp.documents.update(document.id, {
        title,
      });
    }
  }, [title]);

  return (
    <div className="select-text relative">
      <div className="flex items-center justify-between space-x-2 sticky top-0 z-10 bg-background py-2">
        <div className="flex items-center gap-2">
          <DocumentConfigButton document={document} />
        </div>
        <div className="text-xs text-muted-foreground truncate">{title}</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-6 h-6">
            <LinkIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <MarkdownWrapper
        className="mx-auto max-w-full"
        autoTranslate={document.config.autoTranslate}
        onSpeech={onSpeech}
        onParagraphVisible={onParagraphVisible}
        translatable={true}
      >
        {content}
      </MarkdownWrapper>
    </div>
  );
};
