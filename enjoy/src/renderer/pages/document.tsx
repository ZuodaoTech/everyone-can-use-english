import {
  Button,
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
import { useNavigate, useParams } from "react-router-dom";
import { DocumentProvider, DocumentProviderContext } from "@renderer/context";
import { ChevronLeftIcon } from "lucide-react";

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
  const navigate = useNavigate();

  if (!document) {
    return (
      <div className="h-screen flex flex-col justify-center items-center relative">
        <LoaderSpin />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative">
      <div className="flex space-x-1 items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <span className="text-sm line-clamp-1">{document.title}</span>
      </div>

      <ResizablePanelGroup direction="horizontal" className="p-4">
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
          className={playingSegment ? "invisible mx-2" : "invisible"}
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
