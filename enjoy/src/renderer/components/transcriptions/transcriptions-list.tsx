import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { LoaderSpin } from "@renderer/components";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadCloudIcon,
} from "lucide-react";

export const TranscriptionsList = (props: {
  media: AudioType | VideoType;
  transcription?: TranscriptionType;
  onFinish?: () => void;
}) => {
  const { media, transcription, onFinish } = props;
  const { webApi, EnjoyApp } = useContext(AppSettingsProviderContext);
  const [transcriptions, setTranscriptions] = useState<TranscriptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTranscriptions = async (params: { page: number }) => {
    const { page = currentPage } = params;
    setLoading(true);
    webApi
      .transcriptions({
        targetMd5: media.md5,
        items: 10,
        page,
      })
      .then(({ transcriptions, next, page }) => {
        setTranscriptions(transcriptions);
        setCurrentPage(page);
        setNextPage(next);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDownload = (tr: TranscriptionType) => {
    EnjoyApp.transcriptions
      .update(transcription.id, {
        state: "finished",
        result: tr.result,
        engine: tr.engine,
        model: tr.model,
        language: tr.language || media.language,
      })
      .then(() => {
        onFinish?.();
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    fetchTranscriptions({ page: 1 });
  }, [media]);

  if (loading) {
    return <LoaderSpin />;
  }

  if (!transcriptions.length) {
    return (
      <div className="text-muted-foreground text-center text-sm py-6">
        {t("noData")}
      </div>
    );
  }

  return (
    <div className="">
      <div className="mb-4 text-sm text-muted-foreground">
        {t("downloadTranscriptFromCloud")}:
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead className="capitalize">{t("model")}</TableHead>
            <TableHead className="capitalize">{t("language")}</TableHead>
            <TableHead className="capitalize">{t("downloads")}</TableHead>
            <TableHead className="capitalize">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transcriptions.map((tr) => (
            <TableRow key={tr.id}>
              <TableCell className="text-xs font-mono">
                {tr.id.split("-")[0]}
              </TableCell>
              <TableCell>
                <div className="text-sm">{tr.engine}</div>
                <div className="text-xs text-muted-foreground">{tr.model}</div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{tr.language || "-"}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs">{tr.downloadsCount}</span>
              </TableCell>
              <TableCell>
                {transcription?.id === tr.id ? (
                  <CheckCircleIcon className="text-green-600 w-4 h-4" />
                ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleDownload(tr)}
                  >
                    <DownloadCloudIcon className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-muted-foreground flex items-center justify-center space-x-2 my-4">
        <Button
          variant="ghost"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => fetchTranscriptions({ page: currentPage - 1 })}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <span className="text-sm font-mono">{currentPage}</span>
        <Button
          variant="ghost"
          size="icon"
          disabled={!nextPage}
          onClick={() => fetchTranscriptions({ page: currentPage + 1 })}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
