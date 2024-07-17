import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { LoaderSpin } from "@renderer/components";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@renderer/components/ui";
import { t } from "i18next";
import { formatDateTime } from "@renderer/lib/utils";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

export const TranscriptionsList = (props: {
  target: AudioType | VideoType;
  onDownload: (transcription: TranscriptionType) => void;
  currentTranscription?: TranscriptionType;
}) => {
  const { target, onDownload, currentTranscription } = props;
  const [transcriptions, setTranscriptions] = useState<TranscriptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const { webApi } = useContext(AppSettingsProviderContext);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTranscriptions = async (params: { page: number }) => {
    if (!hasMore) return;

    const { page = currentPage } = params;
    setLoading(true);
    webApi
      .transcriptions({
        targetMd5: target.md5,
        page,
      })
      .then(({ transcriptions, next, page }) => {
        setTranscriptions(transcriptions);
        setCurrentPage(page);
        setHasMore(!!next);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTranscriptions({ page: 1 });
  }, [target]);

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>{t("model")}</TableHead>
            <TableHead>{t("language")}</TableHead>
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transcriptions.map((transcription) => (
            <TableRow key={transcription.id}>
              <TableCell className="text-xs font-mono">
                {transcription.id.split("-")[0]}
              </TableCell>
              <TableCell className="text-sm">
                {transcription.engine}/{transcription.model}
              </TableCell>
              <TableCell className="text-sm">
                <Badge>{transcription.language || "-"}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                {formatDateTime(transcription.createdAt)}
              </TableCell>
              <TableCell>
                {currentTranscription?.id === transcription.id ? (
                  <CheckCircleIcon className="text-green-600 w-4 h-4" />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(transcription)}
                  >
                    {t("download")}
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
          disabled={!hasMore}
          onClick={() => fetchTranscriptions({ page: currentPage + 1 })}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
