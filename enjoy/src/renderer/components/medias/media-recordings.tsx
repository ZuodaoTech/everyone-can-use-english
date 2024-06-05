import { useContext, useRef, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import {
  AppSettingsProviderContext,
  HotKeysSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import {
  LoaderIcon,
  MicIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "i18next";
import { formatDateTime, formatDuration } from "@renderer/lib/utils";

export const MediaRecordings = () => {
  const { currentHotkeys } = useContext(HotKeysSettingsProviderContext);
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

  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const handleDelete = () => {
    if (!selectedRecording) return;

    EnjoyApp.recordings.destroy(selectedRecording.id).catch((err) => {
      toast.error(err.message);
    });
  };

  useEffect(() => {
    setCurrentRecording(recordings[0]);
  }, [currentSegmentIndex, recordings?.[0]?.id]);

  return (
    <div ref={containerRef} data-testid="media-recordings-result">
      {recordings.length == 0 && (
        <div
          className="text-center px-6 py-8 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: t("noRecordingForThisSegmentYet", {
              key: currentHotkeys.StartOrStopRecording?.toUpperCase(),
            }),
          }}
        ></div>
      )}

      {recordings.map((recording) => (
        <div
          key={recording.id}
          className={`flex items-center justify-between px-4 py-2 cursor-pointer ${
            recording.id === currentRecording?.id ? "bg-muted" : ""
          }`}
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
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {formatDateTime(recording.createdAt)}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreHorizontalIcon className="w-4 h-4" />
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => setSelectedRecording(recording)}
                >
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  <span>{t("delete")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {hasMoreRecordings && (
        <div className="py-2 flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingRecordings}
            onClick={() => fetchRecordings(recordings.length)}
          >
            {loadingRecordings && (
              <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
            )}
            {t("loadMore")}
          </Button>
        </div>
      )}

      <AlertDialog
        open={selectedRecording}
        onOpenChange={(value) => {
          if (value) return;
          setSelectedRecording(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRecording")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecordingConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleDelete}>{t("delete")}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
