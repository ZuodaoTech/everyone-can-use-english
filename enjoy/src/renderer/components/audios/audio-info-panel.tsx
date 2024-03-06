import { createContext, useEffect, useState, useContext, useRef } from "react";
import {
  ScrollArea,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@renderer/components/ui";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { LoaderIcon, PlayIcon, CheckCircleIcon, MicIcon } from "lucide-react";
import { formatDuration, formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";

export const AudioInfoPanel = () => {
  const { media } = useContext(MediaPlayerProviderContext);
  if (!media) return null;

  return (
    <ScrollArea className="border rounded-lg shadow-lg px-4" data-testid="media-info-panel">
      <div className="sticky top-0 py-2 bg-background z-10">
        {t("mediaInfo")}
      </div>
      <Table>
        <TableBody>
          <TableRow className="border-none">
            <TableCell>{t("models.audio.name")}:</TableCell>
            <TableCell>{media.name}</TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableCell>{t("models.audio.duration")}:</TableCell>
            <TableCell>{formatDuration(media.duration)}</TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableCell>{t("models.audio.recordingsCount")}:</TableCell>
            <TableCell>
              {media.recordingsCount ? media.recordingsCount : 0}
            </TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableCell>{t("models.audio.recordingsDuration")}:</TableCell>
            <TableCell>
              {formatDuration(media.recordingsDuration, "ms")}
            </TableCell>
          </TableRow>
          <TableRow className="border-none">
            <TableCell>{t("models.audio.createdAt")}:</TableCell>
            <TableCell>{formatDateTime(media.createdAt)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
