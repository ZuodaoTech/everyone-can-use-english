import { useContext } from "react";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@renderer/components/ui";
import { MediaPlayerProviderContext } from "@renderer/context";
import { formatDuration, formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";

export const MediaInfoPanel = () => {
  const { media } = useContext(MediaPlayerProviderContext);
  if (!media) return null;

  return (
    <div className="px-4" data-testid="media-info-panel">
      <Table>
        <TableBody>
          <TableRow className="border-none">
            <TableHead className="w-20 capitalize">
              {t("models.audio.name")}:
            </TableHead>
            <TableCell>{media.name}</TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableHead className="w-20 capitalize">
              {t("models.audio.duration")}:
            </TableHead>
            <TableCell>{formatDuration(media.duration)}</TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableHead className="w-20 capitalize">
              {t("models.audio.recordingsCount")}:
            </TableHead>
            <TableCell>
              {media.recordingsCount ? media.recordingsCount : 0}
            </TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableHead className="w-20 capitalize">
              {t("models.audio.recordingsDuration")}:
            </TableHead>
            <TableCell>
              {formatDuration(media.recordingsDuration, "ms")}
            </TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableHead className="w-20 capitalize">
              {t("models.audio.createdAt")}:
            </TableHead>
            <TableCell>{formatDateTime(media.createdAt)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
