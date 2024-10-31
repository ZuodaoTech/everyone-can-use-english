import { t } from "i18next";
import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import {
  DocumentHtmlRenderer,
  DocumentMarkdownRenderer,
  DocumentEpubRenderer,
  PagePlaceholder,
} from "@renderer/components";
import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import { ChevronLeftIcon } from "lucide-react";

export default () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentEType | null>(null);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [displayPlayer, setDisplayPlayer] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchDocument = () => {
    EnjoyApp.documents
      .findOne({ id })
      .then((document) => {
        setDocument(document);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const handleSpeech = (id: string) => {
    console.log("speech", id);
    const paragraph = ref.current?.querySelector(`#paragraph-${id}`);
    console.log("paragraph", paragraph?.textContent);
    setDisplayPlayer(true);
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  if (!document) {
    return <PagePlaceholder placeholder={t("notFound")} />;
  }

  return (
    <>
      <div className="h-screen flex flex-col relative">
        <div className="flex space-x-1 items-center h-12 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <span className="text-sm">{document.title}</span>
        </div>

        <ResizablePanelGroup direction="horizontal" className="p-4">
          <ResizablePanel id="document" order={0} className="">
            <ScrollArea
              ref={ref}
              className="h-full px-4 pb-6 border rounded-lg"
            >
              {document.metadata.extension === "html" && (
                <DocumentHtmlRenderer document={document} />
              )}
              {document.metadata.extension === "epub" && (
                <DocumentEpubRenderer
                  document={document}
                  onSpeech={handleSpeech}
                />
              )}
            </ScrollArea>
          </ResizablePanel>
          {displayPlayer && (
            <>
              <ResizableHandle className="mx-4" />
              <ResizablePanel id="player" order={1}></ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </>
  );
};
