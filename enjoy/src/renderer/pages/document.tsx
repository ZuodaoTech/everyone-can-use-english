import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
} from "@renderer/components/ui";
import {
  DocumentHtmlRenderer,
  DocumentEpubRenderer,
  DocumentPlayer,
  LoaderSpin,
  DocumentTextRenderer,
} from "@renderer/components";
import { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { DocumentProvider, DocumentProviderContext } from "@renderer/context";
import { t } from "i18next";

export default () => {
  const { id } = useParams<{ id: string }>();

  return (
    <DocumentProvider documentId={id}>
      <DocumentComponent />
    </DocumentProvider>
  );
};

const DocumentComponent = () => {
  const { document, playingSegment } = useContext(DocumentProviderContext);

  if (!document) {
    return (
      <div className="h-content flex flex-col justify-center items-center relative">
        <LoaderSpin />
      </div>
    );
  }

  return (
    <div className="h-content flex flex-col relative">
      <Breadcrumb className="px-4 pt-3 pb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/documents`}>{t("sidebar.documents")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm line-clamp-1">{document.title}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ResizablePanelGroup
        direction={document.layout || "horizontal"}
        className="px-4 pb-4"
      >
        <ResizablePanel id="document" order={0}>
          <ScrollArea
            className={`h-full px-4 pb-6 border rounded-lg shadow-lg ${
              playingSegment ? "" : "max-w-screen-md mx-auto"
            }`}
          >
            {document.metadata.extension === "html" && <DocumentHtmlRenderer />}
            {document.metadata.extension === "epub" && <DocumentEpubRenderer />}
            {["txt", "md", "markdown"].includes(
              document.metadata.extension
            ) && <DocumentTextRenderer />}
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle
          className={`${document.layout === "horizontal" ? "mx-2" : "my-2"} ${
            playingSegment ? "" : "invisible"
          }`}
        />
        <ResizablePanel
          id="player"
          order={1}
          className={playingSegment ? "" : "invisible fixed"}
        >
          <DocumentPlayer />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
