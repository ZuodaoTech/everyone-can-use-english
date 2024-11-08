import { useContext, useEffect } from "react";
import {
  DocumentConfigButton,
  LoaderSpin,
  MarkdownWrapper,
} from "@renderer/components";
import {
  AppSettingsProviderContext,
  DocumentProviderContext,
} from "@renderer/context";
import { Button } from "@renderer/components/ui";
import { LinkIcon } from "lucide-react";

export const DocumentTextRenderer = () => {
  const { document, onSpeech, onSegmentVisible, content, setContent } =
    useContext(DocumentProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const fetchContent = async () => {
    const res = await fetch(document.src);
    console.log("res", res);
    const text = await res.text();
    console.log("text", text);
    setContent(text);
  };

  useEffect(() => {
    fetchContent();
  }, [document.src]);

  if (!content) return <LoaderSpin />;

  return (
    <div className="select-text relative">
      <div className="flex items-center justify-between space-x-2 sticky top-0 z-10 bg-background py-2">
        <div className="flex items-center gap-2">
          <DocumentConfigButton document={document} />
        </div>
        <div className="text-xs text-muted-foreground max-w-full truncate">
          {document.title}
        </div>
        <div className="flex items-center gap-2">
          {document.metadata?.source && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => {
                EnjoyApp.shell.openExternal(document.metadata.source);
              }}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <MarkdownWrapper
        className="mx-auto max-w-full"
        autoTranslate={document.config.autoTranslate}
        onSpeech={onSpeech}
        onSegmentVisible={onSegmentVisible}
        translatable={true}
      >
        {content}
      </MarkdownWrapper>
    </div>
  );
};
