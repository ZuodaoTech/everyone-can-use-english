import { DocumentCard } from "@renderer/components";
import { Button, ScrollArea, ScrollBar } from "@renderer/components/ui";
import { t } from "i18next";
import { Link } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

export const DocumentsSegment = () => {
  const [documents, setDocuments] = useState<DocumentEType[]>([]);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const fetchDocuments = async () => {
    EnjoyApp.documents.findAll({ limit: 10 }).then((docs) => {
      setDocuments(docs);
    });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (documents.length == 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {t("addedDocuments")}
          </h2>
        </div>
        <div className="ml-auto mr-4">
          <Link to="/documents">
            <Button variant="link" className="capitalize">
              {t("seeMore")}
            </Button>
          </Link>
        </div>
      </div>

      <ScrollArea>
        <div className="flex items-center space-x-4 pb-4">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              className="w-48"
              onDelete={() =>
                setDocuments(documents.filter((d) => d.id !== document.id))
              }
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
