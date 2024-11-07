import { Button, Input } from "@renderer/components/ui";
import {
  DocumentAddButton,
  DocumentCard,
  LoaderSpin,
} from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@uidotdev/usehooks";

export default () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentEType[]>([]);
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const debouncedQuery = useDebounce(query, 500);

  const fetchDocuments = () => {
    setLoading(true);
    EnjoyApp.documents
      .findAll({ query: debouncedQuery })
      .then((documents) => {
        setDocuments(documents);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, [debouncedQuery]);

  return (
    <div className="h-full max-w-5xl mx-auto px-4 py-6">
      <div className="flex space-x-1 items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <span>{t("sidebar.documents")}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          className="max-w-48"
          placeholder={t("search")}
          onChange={(e) => setQuery(e.target.value)}
        />
        <DocumentAddButton />
      </div>

      {loading ? (
        <LoaderSpin />
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
};
