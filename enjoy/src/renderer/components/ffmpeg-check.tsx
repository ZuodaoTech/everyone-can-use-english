import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { Button, Progress } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { CheckCircle2Icon, XCircleIcon, LoaderIcon } from "lucide-react";

export const FfmpegCheck = () => {
  const { ffmpegConfg, setFfmegConfig, EnjoyApp } = useContext(
    AppSettingsProviderContext
  );
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadFfmpeg = () => {
    listenToDownloadState();
    setDownloading(true);
    EnjoyApp.ffmpeg
      .download()
      .then((config) => {
        if (config) {
          setFfmegConfig(config);
        }
      })
      .finally(() => {
        setDownloading(false);
      });
  };

  const listenToDownloadState = () => {
    EnjoyApp.download.onState((_event, downloadState) => {
      const { received, total } = downloadState;
      setProgress(Math.round((received * 100) / total));
    });
  };

  useEffect(() => {
    return EnjoyApp.download.removeAllListeners();
  }, [ffmpegConfg?.ready]);

  return (
    <div className="w-full max-w-sm px-6">
      {ffmpegConfg?.ready ? (
        <>
          <div className="flex justify-center items-center mb-8">
            <img src="./assets/ffmpeg-logo.svg" className="" />
          </div>
          <div className="flex justify-center mb-4">
            <CheckCircle2Icon className="text-green-500 w-10 h-10 mb-4" />
          </div>
          <div className="text-center text-sm opacity-70">
            {t("ffmpegInstalled")}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-center items-center mb-8">
            <img src="./assets/ffmpeg-logo.svg" className="" />
          </div>
          <div className="flex justify-center mb-4">
            <XCircleIcon className="text-red-500 w-10 h-10" />
          </div>
          <div className="text-center text-sm opacity-70 mb-4">
            {t("ffmpegNotInstalled")}
          </div>
          <div className="flex items-center justify-center mb-4">
            <Button
              disabled={downloading}
              className=""
              onClick={downloadFfmpeg}
            >
              {downloading && <LoaderIcon className="animate-spin mr-2" />}
              {t("downloadFfmpeg")}
            </Button>
          </div>
          {downloading && (
            <div className="w-full">
              <Progress value={progress} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
