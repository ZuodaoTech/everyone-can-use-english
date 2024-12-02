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
  AlertDialogTrigger,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  toast,
  RadioGroup,
  RadioGroupItem,
  Label,
} from "@renderer/components/ui";
import {
  AppSettingsProviderContext,
  HotKeysSettingsProviderContext,
  MediaShadowProviderContext,
} from "@renderer/context";
import {
  GaugeCircleIcon,
  LoaderIcon,
  MicIcon,
  MoreHorizontalIcon,
  SquareMenuIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "i18next";
import { formatDateTime, formatDuration } from "@renderer/lib/utils";

export const MediaRecordings = () => {
  const { currentHotkeys } = useContext(HotKeysSettingsProviderContext);
  const containerRef = useRef<HTMLDivElement>();
  const {
    recordings = [],
    currentRecording,
    setCurrentRecording,
    currentSegmentIndex,
    transcription,
    media,
  } = useContext(MediaShadowProviderContext);

  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [deleteBulkType, setDeleteBulkType] = useState("noAssessments");

  const handleDelete = () => {
    if (!selectedRecording) return;

    EnjoyApp.recordings.destroy(selectedRecording.id).catch((err) => {
      toast.error(err.message);
    });
  };

  const recordingsWithoutAssessment = recordings.filter(
    (r) => !r.pronunciationAssessment
  );
  const recordingsWithScoreLessThan90 = recordings.filter(
    (r) =>
      !r.pronunciationAssessment ||
      r.pronunciationAssessment.pronunciationScore < 90
  );
  const recordingsWithScoreLessThan80 = recordings.filter(
    (r) =>
      !r.pronunciationAssessment ||
      r.pronunciationAssessment.pronunciationScore < 80
  );

  const handleDestroyBulk = () => {
    let ids: string[] = [];
    if (deleteBulkType === "noAssessments") {
      ids = recordingsWithoutAssessment.map((r) => r.id);
    } else if (deleteBulkType === "scoreLessThan90") {
      ids = recordingsWithScoreLessThan90.map((r) => r.id);
    } else if (deleteBulkType === "scoreLessThan80") {
      ids = recordingsWithScoreLessThan80.map((r) => r.id);
    } else if (deleteBulkType === "all") {
      ids = recordings.map((r) => r.id);
    }

    if (ids.length === 0) {
      toast.error(t("noRecordingsToDelete"));
      return;
    }

    EnjoyApp.recordings
      .destroyBulk({
        ids,
        targetId: media.id,
        targetType: media.mediaType,
      })
      .then(() => {
        toast.success(t("recordingsDeletedSuccessfully"));
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const handleExport = async () => {
    try {
      const url = await EnjoyApp.recordings.export(media.id, media.mediaType);
      const filename = `Recording(${media.name}).mp3`;

      EnjoyApp.dialog
        .showSaveDialog({
          title: t("download"),
          defaultPath: filename,
          filters: [
            {
              name: "Audio",
              extensions: ["mp3"],
            },
          ],
        })
        .then((savePath) => {
          if (!savePath) return;

          toast.promise(EnjoyApp.download.start(url, savePath as string), {
            loading: t("downloadingFile", { file: filename }),
            success: () => t("downloadedSuccessfully"),
            error: t("downloadFailed"),
            position: "bottom-right",
          });
        })
        .catch((err) => {
          if (err) toast.error(err.message);
        });
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    setCurrentRecording(recordings[0]);
  }, [currentSegmentIndex, recordings]);

  return (
    <div ref={containerRef} data-testid="media-recordings-result">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="text-sm text-muted-foreground">
          #{currentSegmentIndex + 1}/{transcription?.result?.timeline?.length}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <SquareMenuIcon className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="block w-full">
                    {t("export")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("exportRecordings")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("exportRecordingsConfirmation")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button onClick={handleExport}>{t("export")}</Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="block w-full">
                    {t("bulkDelete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("bulkDelete")}</AlertDialogTitle>
                    <AlertDialogDescription className="mb-4">
                      {t("bulkDeleteRecordingsConfirmation")}
                    </AlertDialogDescription>
                    <RadioGroup
                      value={deleteBulkType}
                      onValueChange={(value) => setDeleteBulkType(value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="noAssessments"
                          id="noAssessments"
                        />
                        <Label htmlFor="noAssessments">
                          {t("deleteRecordingsWithoutAssessment")}(
                          {recordingsWithoutAssessment.length})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="scoreLessThan90"
                          id="scoreLessThan90"
                        />
                        <Label htmlFor="scoreLessThan90">
                          {t("deleteRecordingsWithScoreLessThan90")}(
                          {recordingsWithScoreLessThan90.length})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="scoreLessThan80"
                          id="scoreLessThan80"
                        />
                        <Label htmlFor="scoreLessThan80">
                          {t("deleteRecordingsWithScoreLessThan80")}(
                          {recordingsWithScoreLessThan80.length})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="text-destructive">
                          {t("deleteAllRecordings")}({recordings.length})
                        </Label>
                      </div>
                    </RadioGroup>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button onClick={handleDestroyBulk}>{t("delete")}</Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
            {recording.pronunciationAssessment?.result && (
              <div
                className={`flex items-center space-x-1
                    ${
                      recording.pronunciationAssessment
                        ? recording.pronunciationAssessment
                            .pronunciationScore >= 80
                          ? "text-green-500"
                          : recording.pronunciationAssessment
                              .pronunciationScore >= 60
                          ? "text-yellow-600"
                          : "text-red-500"
                        : ""
                    }
                    `}
              >
                <GaugeCircleIcon className="w-4 h-4" />
                <span className="text-xs font-mono">
                  {recording.pronunciationAssessment.pronunciationScore}
                </span>
              </div>
            )}
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
