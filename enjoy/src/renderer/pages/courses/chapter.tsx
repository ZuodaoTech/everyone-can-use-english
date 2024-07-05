import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Separator,
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MarkdownWrapper, WavesurferPlayer } from "@renderer/components";

export default () => {
  const { id, sequence } = useParams<{ id: string; sequence: string }>();
  const { webApi, nativeLanguage } = useContext(AppSettingsProviderContext);
  const [chapter, setChapter] = useState<ChapterType | null>(null);

  const fetchChapter = async (id: string, sequence: string) => {
    webApi
      .coursechapter(id, sequence)
      .then((chapter) => setChapter(chapter))
      .catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    fetchChapter(id, sequence);
  }, [id, sequence]);

  return (
    <div className="flex flex-col h-screen px-4 xl:px-6 py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/courses">{t("sidebar.courses")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>
            <Link to={`/courses/${id}`}>{chapter?.course?.title || id}</Link>
          </BreadcrumbPage>
          <BreadcrumbSeparator />
          <BreadcrumbPage>{chapter?.title || sequence}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-1 h-[calc(100vh-5.75rem)] border rounded-lg">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>
            <ScrollArea className="px-4 py-3 h-full relative">
              <ChapterContent chapter={chapter} />
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <ScrollArea className="px-4 py-3">Conversation</ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

const ChapterContent = (props: { chapter: ChapterType }) => {
  const { nativeLanguage } = useContext(AppSettingsProviderContext);
  const { chapter } = props;
  const translation = chapter?.translations?.find(
    (t) => t.language === nativeLanguage
  );

  if (!chapter) return null;

  return (
    <div className="select-text prose dark:prose-invert mx-auto">
      <h2>{chapter?.title}</h2>
      <MarkdownWrapper>{chapter?.content}</MarkdownWrapper>
      {translation && (
        <details>
          <summary>{t("translation")}</summary>
          <MarkdownWrapper>{translation.content}</MarkdownWrapper>
        </details>
      )}

      {chapter.examples.length > 0 && <h3>{t("examples")}</h3>}
      {chapter.examples.map((example, index) => (
        <>
          <ExampleContent key={index} example={example} />
          <Separator className="my-4" />
        </>
      ))}
    </div>
  );
};

const ExampleContent = (props: { example: ChapterType["examples"][0] }) => {
  const { nativeLanguage } = useContext(AppSettingsProviderContext);
  const { example } = props;
  const translation = example?.translations?.find(
    (t) => t.language === nativeLanguage
  );

  if (!example) return null;

  return (
    <div>
      <MarkdownWrapper>{example.content}</MarkdownWrapper>
      {translation && (
        <details>
          <summary>{t("translation")}</summary>
          <MarkdownWrapper>{translation.content}</MarkdownWrapper>
        </details>
      )}
      <WavesurferPlayer id={example.id} src={example.audioUrl} />
    </div>
  );
};
