import { createContext, useEffect, useState, useContext, useRef } from "react";
import { ScrollArea, Button, toast } from "@renderer/components/ui";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { LoaderIcon, PlayIcon, CheckCircleIcon, MicIcon } from "lucide-react";
import { t } from "i18next";
import { formatDateTime, formatDuration } from "@renderer/lib/utils";

export const AudioRecordings = () => {
  const containerRef = useRef<HTMLDivElement>();
  const {
    recordings = [],
    hasMoreRecordings,
    loadingRecordings,
    fetchRecordings,
  } = useContext(MediaPlayerProviderContext);

  return (
    <ScrollArea
      ref={containerRef}
      className="border rounded-lg shadow-lg"
      data-testid="media-recordings-result"
    >
      <div className="sticky top-0 px-4 py-2 bg-background z-10">
        <div className="flex items-cener justify-between">
          <div className="capitalize">{t("recordings")}</div>
          {recordings.length > 0 && (
            <span className="font-serif text-muted-foreground">
              ({recordings.length})
            </span>
          )}
        </div>
      </div>
      {recordings.length == 0 && (
        <div className="text-center px-6 py-8 text-sm text-muted-foreground capitalize">
          {t("noRecordingForThisSetmentYet")}
        </div>
      )}
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="flex items-center justify-between px-4 py-2"
          style={{
            borderLeftColor: `#${recording.md5.substr(0, 6)}`,
            borderLeftWidth: 3,
          }}
        >
          <div className="flex items-center space-x-2">
            <MicIcon className="w-4 h-4" />
            <span>{formatDuration(recording.duration, "ms")}</span>
          </div>
          <span className="">{formatDateTime(recording.createdAt)}</span>
        </div>
      ))}
      {hasMoreRecordings && (
        <div className="py-2 flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingRecordings}
            onClick={fetchRecordings}
          >
            {loadingRecordings && (
              <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
            )}
            {t("loadMore")}
          </Button>
        </div>
      )}
    </ScrollArea>
  );
};
