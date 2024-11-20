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
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import { AppSettingsProviderContext, CourseProvider } from "@renderer/context";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChapterContent, LlmChat } from "@renderer/components";

export default () => {
  const { id, sequence } = useParams<{ id: string; sequence: string }>();
  const { webApi } = useContext(AppSettingsProviderContext);
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

  useEffect(() => {
    if (!chapter) return;
    webApi.updateEnrollment(chapter.enrollment.id, {
      currentChapterId: chapter.id,
    });
  }, [chapter]);

  return (
    <CourseProvider id={id}>
      <div className="flex flex-col h-content px-4 xl:px-6 py-4">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/courses">{t("sidebar.courses")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbLink asChild>
              <Link to={`/courses/${id}`}>{chapter?.course?.title || id}</Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{chapter?.title || sequence}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1 h-[calc(100vh-7.75rem)] border rounded-lg">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50}>
              <ScrollArea className="px-4 py-3 h-full relative bg-muted">
                <ChapterContent
                  chapter={chapter}
                  onUpdate={() => fetchChapter(id, sequence)}
                />
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel className="bg-muted">
              <LlmChat agentType="Chapter" agentId={chapter?.id} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </CourseProvider>
  );
};
