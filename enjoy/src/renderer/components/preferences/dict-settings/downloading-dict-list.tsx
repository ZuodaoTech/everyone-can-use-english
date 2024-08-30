import {
  DictProviderContext,
  AppSettingsProviderContext,
} from "@/renderer/context";
import { useContext, useEffect, useState } from "react";
import { Button, toast } from "@renderer/components/ui";
import { t } from "i18next";
import { LoaderIcon } from "lucide-react";

export const DownloadingDictList = function () {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { downloadingDicts, reload } = useContext(DictProviderContext);

  useEffect(() => {
    listenToDownloadState();
    listenDecompressState();

    return () => {
      EnjoyApp.download.removeAllListeners();
      EnjoyApp.decompress.removeAllListeners();
    };
  }, []);

  const listenToDownloadState = () => {
    EnjoyApp.download.onState((_event, state) => {
      reload();
    });
  };

  const listenDecompressState = () => {
    EnjoyApp.decompress.onUpdate((_event, tasks) => {
      reload();
    });
  };

  return (
    <>
      {downloadingDicts.map((item) => (
        <DownloadingDictItem key={item.name} dict={item} />
      ))}
    </>
  );
};

const DownloadingDictItem = function ({ dict }: { dict: Dict }) {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { reload } = useContext(DictProviderContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dict.downloadState?.state === "completed") {
      EnjoyApp.dict.decompress(dict);
    }
  }, [dict]);

  async function handlePause() {
    setLoading(true);

    try {
      await EnjoyApp.download.pause(dict.downloadState.name);
      reload();
    } catch (err) {
      toast.error(err.message);
    }

    setLoading(false);
  }

  async function handleResume() {
    setLoading(true);

    try {
      await EnjoyApp.download.resume(dict.downloadState.name);
      reload();
    } catch (err) {
      toast.error(err.message);
    }

    setLoading(false);
  }

  async function handleRemove() {
    setLoading(true);

    try {
      await EnjoyApp.download.remove(dict.downloadState.name);
      toast.success(t("dictRemoved"));
      reload();
    } catch (err) {
      toast.error(err.message);
    }

    setLoading(false);
  }

  function displaySize(bytes: number) {
    return Number((bytes / 1024 / 1024).toFixed(0)).toLocaleString() + "MB";
  }

  function renderDownloadState() {
    const text =
      dict.downloadState.state === "cancelled"
        ? t("cancelled")
        : dict.downloadState.state === "completed"
        ? t("completedAndChecking")
        : dict.downloadState.state === "interrupted"
        ? t("interrupted")
        : dict.downloadState.isPaused
        ? t("paused")
        : t("downloadingDict");

    return (
      <div className="text-xs text-muted-foreground">
        <span className="mr-2">{text}</span>
        <span className="">{displaySize(dict.downloadState.received)}</span>
        <span className="mx-1">/</span>
        <span className="">{displaySize(dict.downloadState.total)}</span>
      </div>
    );
  }

  function renderDecompressState() {
    return (
      <div className="text-xs text-muted-foreground">
        <span>{t("decompressing")}</span>
        <span className="ml-2">{dict.decompressProgress ?? "0"}%</span>
      </div>
    );
  }

  function renderActions() {
    if (loading)
      return (
        <div>
          <LoaderIcon className="text-muted-foreground animate-spin" />
        </div>
      );

    if (
      dict.downloadState?.state === "progressing" &&
      !dict.downloadState?.isPaused
    ) {
      return (
        <Button variant="secondary" size="sm" onClick={handlePause}>
          {t("pause")}
        </Button>
      );
    }

    if (
      dict.downloadState?.state === "cancelled" ||
      dict.downloadState?.state === "interrupted" ||
      (dict.downloadState?.state === "progressing" &&
        dict.downloadState?.isPaused)
    ) {
      return (
        <>
          {dict.downloadState.canResume && (
            <Button
              variant="secondary"
              size="sm"
              className="mr-2"
              onClick={handleResume}
            >
              {t("resume")}
            </Button>
          )}

          <Button variant="secondary" size="sm" onClick={handleRemove}>
            {t("delete")}
          </Button>
        </>
      );
    }
  }

  return (
    <div key={dict.name} className="flex items-center py-2">
      <div className="flex-grow">
        <div>{dict.title}</div>
        <div className="mt-1">
          {dict.state === "decompressing" && renderDecompressState()}
          {dict.downloadState && renderDownloadState()}
        </div>
      </div>
      {renderActions()}
    </div>
  );
};
