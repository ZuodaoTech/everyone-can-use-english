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
} from "@renderer/components";
import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DocumentProvider, DocumentProviderContext } from "@renderer/context";
import { ChevronLeftIcon } from "lucide-react";
import { t } from "i18next";

export default () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <DocumentProvider documentId={id}>
      <DocumentComponent />
    </DocumentProvider>
  );
};

const DocumentComponent = () => {
  const { document, playingParagraph } = useContext(DocumentProviderContext);
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
      <div className="flex space-x-1 items-center h-12 px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <span className="text-sm">{document.title}</span>
      </div>

      <ResizablePanelGroup direction="horizontal" className="p-4">
        <ResizablePanel id="document" order={0} className="">
          <ScrollArea className="h-full px-4 pb-6 border rounded-lg shadow-lg">
            {document.metadata.extension === "html" && (
              <DocumentHtmlRenderer document={document} />
            )}
            {document.metadata.extension === "epub" && <DocumentEpubRenderer />}
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle
          className={playingParagraph ? "invisible mx-2" : "invisible"}
        />
        <ResizablePanel
          id="player"
          order={1}
          className={playingParagraph ? "" : "invisible fixed"}
        >
          <DocumentPlayer />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
