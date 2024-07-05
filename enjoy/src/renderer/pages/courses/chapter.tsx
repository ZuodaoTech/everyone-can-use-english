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
import { AppSettingsProviderContext } from "@renderer/context";
import { t, use } from "i18next";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";

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
      <div className="flex-1 border rounded-lg">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>
            <ScrollArea className="px-4 py-3 h-full">
              <div className="select-text prose dark:prose-invert">
                <h2>{chapter?.title}</h2>
                <Markdown
                  components={{
                    a({ node, children, ...props }) {
                      try {
                        new URL(props.href ?? "");
                        props.target = "_blank";
                        props.rel = "noopener noreferrer";
                      } catch (e) {}

                      return <a {...props}>{children}</a>;
                    },
                  }}
                >
                  {chapter?.content}
                </Markdown>
              </div>
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
