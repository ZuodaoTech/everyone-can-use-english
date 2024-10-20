import { t } from "i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Separator,
  ScrollArea,
  RadioGroup,
  RadioGroupItem,
  Label,
  Progress,
  toast,
} from "@renderer/components/ui";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@/renderer/context";
import { humanFileSize } from "@/utils";
import { LoaderIcon } from "lucide-react";

export const DiskUsage = () => {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("diskUsage")}</div>
        <div className="text-sm text-muted-foreground mb-2">
          {t("diskUsageDescription")}
        </div>
      </div>

      <div className="">
        <div className="mb-2 flex items-center space-x-2 justify-end">
          <UsageDetail />
          <ReleaseDiskSpace />
        </div>
      </div>
    </div>
  );
};

const UsageDetail = () => {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<DiskUsageType>([]);
  const [loading, setLoading] = useState(false);

  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const openPath = async (filePath: string) => {
    if (filePath?.match(/.+\.json$/)) {
      await EnjoyApp.shell.openPath(filePath.split("/").slice(0, -1).join("/"));
    } else if (filePath) {
      await EnjoyApp.shell.openPath(filePath);
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      EnjoyApp.app
        .diskUsage()
        .then((usage) => {
          setUsage(usage);
        })
        .catch((err) => {
          toast.error(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          {t("detail")}
        </Button>
      </DialogTrigger>
      <DialogContent className={loading ? "" : "h-3/5"}>
        {loading && (
          <div className="flex items-center justify-center">
            <LoaderIcon className="w-6 h-6 animate-spin" />
          </div>
        )}
        {!loading && (
          <>
            <DialogHeader>
              <DialogTitle>{t("diskUsage")}</DialogTitle>
              <DialogDescription className="sr-only">
                {t("diskUsageDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="h-full overflow-hidden">
              <ScrollArea className="h-full px-4">
                <div className="grid gap-4">
                  {usage.map((item) => (
                    <div key={item.name}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge>/{item.path.split("/").pop()}</Badge>
                            <div className="text-sm text-muted-foreground">
                              {humanFileSize(item.size)}
                            </div>
                          </div>
                          <div className="text-sm">
                            {t(`libraryDescriptions.${item.name}`)}
                          </div>
                        </div>
                        <Button
                          onClick={() => openPath(item.path)}
                          variant="secondary"
                          size="sm"
                        >
                          {t("open")}
                        </Button>
                      </div>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ReleaseDiskSpace = () => {
  const [open, setOpen] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const [deleteBulkType, setDeleteBulkType] = useState("noAssessment");
  const [stats, setStats] = useState<{
    noAssessment: string[];
    scoreLessThan90: string[];
    scoreLessThan80: string[];
    all: string[];
  }>({
    noAssessment: [],
    scoreLessThan90: [],
    scoreLessThan80: [],
    all: [],
  });
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState<string[]>([]);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const refreshStats = () => {
    EnjoyApp.recordings.statsForDeleteBulk().then((s) => {
      setStats(s);
    });
  };

  const handleDestroyBulk = async () => {
    const pendings = stats[deleteBulkType as keyof typeof stats];
    if (pendings.length === 0) {
      toast.warning(t("noRecordingsToDelete"));
      return;
    }

    setDeleting(true);
    const controller = new AbortController();
    setAbortController(controller);

    // seperate pendings into chunks of 100
    const chunks = [];
    for (let i = 0; i < pendings.length; i += 100) {
      chunks.push(pendings.slice(i, i + 100));
    }

    try {
      for (const chunk of chunks) {
        if (controller.signal.aborted) {
          break;
        }
        await EnjoyApp.recordings.destroyBulk({
          ids: chunk,
        });
        setDeleted((prev) => [...prev, ...chunk]);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        toast.warning(t("bulkDeleteAborted"));
      } else {
        toast.error(t(error.message));
      }
    } finally {
      refreshStats();
      setDeleting(false);
      setAbortController(null);
    }
  };

  useEffect(() => {
    if (open) {
      refreshStats();
    } else {
      setDeleted([]);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      abortController?.abort();
    };
  }, [abortController]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="secondary"
          className="text-destructive hover:bg-destructive hover:text-white"
          size="sm"
        >
          {t("releaseDiskSpace")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("bulkDeleteRecordings")}</AlertDialogTitle>
          <AlertDialogDescription className="mb-4">
            {t("bulkDeleteRecordingsConfirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RadioGroup
          className="mb-4"
          value={deleteBulkType}
          onValueChange={(value) => setDeleteBulkType(value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="noAssessment" id="noAssessment" />
            <Label htmlFor="noAssessment">
              {t("deleteRecordingsWithoutAssessment")}(
              {stats.noAssessment.length})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scoreLessThan90" id="scoreLessThan90" />
            <Label htmlFor="scoreLessThan90">
              {t("deleteRecordingsWithScoreLessThan90")}(
              {stats.scoreLessThan90.length})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scoreLessThan80" id="scoreLessThan80" />
            <Label htmlFor="scoreLessThan80">
              {t("deleteRecordingsWithScoreLessThan80")}(
              {stats.scoreLessThan80.length})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="text-destructive">
              {t("deleteAllRecordings")}({stats.all.length})
            </Label>
          </div>
        </RadioGroup>
        {deleting && (
          <div className="mb-4">
            <Progress
              value={deleted.length}
              max={stats[deleteBulkType as keyof typeof stats].length}
              className="mb-4"
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <Button disabled={deleting} onClick={handleDestroyBulk}>
            {deleting && <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />}
            {deleting ? t("deleting") : t("delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
