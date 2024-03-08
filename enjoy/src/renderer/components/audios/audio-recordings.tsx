import { useContext, useRef, useEffect } from "react";
import { ScrollArea, Button } from "@renderer/components/ui";
import { MediaPlayerProviderContext } from "@renderer/context";
import { LoaderIcon, MicIcon } from "lucide-react";
import { t } from "i18next";
import { formatDateTime, formatDuration } from "@renderer/lib/utils";

export const AudioRecordings = () => {
  const containerRef = useRef<HTMLDivElement>();
  const {
    recordings = [],
    hasMoreRecordings,
    loadingRecordings,
    fetchRecordings,
    currentRecording,
    setCurrentRecording,
    currentSegmentIndex,
  } = useContext(MediaPlayerProviderContext);

  useEffect(() => {
    if (currentRecording?.referenceId === currentSegmentIndex) return;
    if (recordings.length === 0) return;

    setCurrentRecording(recordings[0]);
  }, [currentSegmentIndex, recordings]);

  return (
    <ScrollArea
      ref={containerRef}
      className="border rounded-lg shadow-lg"
      data-testid="media-recordings-result"
    >
      <div className="sticky top-0 px-4 py-2 bg-background z-10">
        <div className="flex items-cener justify-between">
          <div className="capitalize">{t("myRecordings")}</div>
          {recordings.length > 0 && (
            <span className="font-serif text-muted-foreground">
              ({recordings.length})
            </span>
          )}
        </div>
      </div>
      {recordings.length == 0 && (
        <div className="text-center px-6 py-8 text-sm text-muted-foreground capitalize">
          {t("noRecordingForThisSegmentYet")}
        </div>
      )}
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="flex items-center justify-between px-4 py-2 cursor-pointer"
          style={{
            borderLeftColor: `#${recording.md5.substr(0, 6)}`,
            borderLeftWidth: 3,
          }}
          onClick={() => {
            setCurrentRecording(recording);
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
