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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@renderer/components/ui";
import {
  AppSettingsProviderContext,
  MediaPlayerProvider,
} from "@renderer/context";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AudioPlayer, ChapterContent } from "@renderer/components";
import { ChevronDownIcon } from "lucide-react";

export default () => {
  const { id, sequence } = useParams<{ id: string; sequence: string }>();
  const { webApi } = useContext(AppSettingsProviderContext);
  const [chapter, setChapter] = useState<ChapterType | null>(null);
  const [shadowing, setShadowing] = useState<AudioType>(null);

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
    <MediaPlayerProvider>
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
              <ScrollArea className="px-4 py-3 h-full relative bg-muted">
                <ChapterContent
                  chapter={chapter}
                  onShadowing={setShadowing}
                  onUpdate={() => fetchChapter(id, sequence)}
                />
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <ScrollArea className="px-4 py-3">Conversation</ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <Sheet
          modal={false}
          open={Boolean(shadowing)}
          onOpenChange={(value) => {
            if (!value) setShadowing(null);
          }}
        >
          <SheetContent
            side="bottom"
            className="h-screen p-0"
            displayClose={false}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <SheetHeader className="flex items-center justify-center h-14">
              <SheetClose>
                <ChevronDownIcon />
              </SheetClose>
            </SheetHeader>

            <AudioPlayer id={shadowing?.id} />
          </SheetContent>
        </Sheet>
      </div>
    </MediaPlayerProvider>
  );
};
