import { Button, Input, toast } from "@renderer/components/ui";
import { StoryForm, LoaderSpin } from "@renderer/components";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@uidotdev/usehooks";
import { DocumentFormats } from "@/constants";

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
        console.log(documents);
        setDocuments(documents);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAdd = async () => {
    const selected = await EnjoyApp.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "documents", extensions: DocumentFormats }],
    });
    if (selected) {
      EnjoyApp.documents
        .create({ uri: selected[0] })
        .then((document) => {
          navigate(`/documents/${document.id}`);
        })
        .catch((err) => {
          toast.error(err.message);
        });
    }
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
        <span>{t("sidebar.audios")}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          className="max-w-48"
          placeholder={t("search")}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={handleAdd}>{t("add")}</Button>
      </div>

      {loading ? (
        <LoaderSpin />
      ) : (
        <div className="grid grid-cols-3 gap-4"></div>
      )}
    </div>
  );
};
