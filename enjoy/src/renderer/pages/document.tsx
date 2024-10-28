import { t } from "i18next";
import { Button, toast } from "@renderer/components/ui";
import {
  DocumentHtmlRenderer,
  DocumentMarkdownRenderer,
  DocumentEpubRenderer,
  PagePlaceholder,
} from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppSettingsProviderContext } from "@renderer/context";
import { ChevronLeftIcon } from "lucide-react";

export default () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentEType | null>(null);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

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

        <div className="flex-1 max-w-prose mx-auto">
          {document.metadata.extension === "html" && (
            <DocumentHtmlRenderer document={document} />
          )}
          {document.metadata.extension === "epub" && (
            <DocumentEpubRenderer document={document} />
          )}
        </div>
      </div>
    </>
  );
};
