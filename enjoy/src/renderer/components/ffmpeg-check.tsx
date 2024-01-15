import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { Button, Progress, toast } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { CheckCircle2Icon, XCircleIcon, LoaderIcon } from "lucide-react";
import Markdown from "react-markdown";

export const FfmpegCheck = () => {
  const { ffmpegConfig, setFfmegConfig, EnjoyApp } = useContext(
    AppSettingsProviderContext
  );
  const [scanResult, setScanResult] = useState<{
    ffmpegPath: string;
    ffprobePath: string;
    scanDirs: string[];
  }>();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const refreshFfmpegConfig = async () => {
    EnjoyApp.settings.getFfmpegConfig().then((config) => {
      setFfmegConfig(config);
    });
  };

  const discoverFfmpeg = () => {
    EnjoyApp.ffmpeg.discover().then((config) => {
      setScanResult(config);
      if (config.ffmpegPath && config.ffprobePath) {
        toast.success(t("ffmpegFound"));
        refreshFfmpegConfig();
      } else {
        toast.error(t("ffmpegNotFound"));
      }
    });
  };

  const downloadFfmpeg = () => {
    listenToDownloadState();
    setDownloading(true);
    EnjoyApp.ffmpeg
      .download()
      .then(() => {
        refreshFfmpegConfig();
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
  }, [ffmpegConfig?.ready]);

  useEffect(() => {
    discoverFfmpeg();
  }, []);

  return (
    <div className="w-full max-w-screen-md mx-auto px-6">
      {ffmpegConfig?.ready ? (
        <>
          <div className="flex justify-center items-center mb-8">
            <img src="./assets/ffmpeg-logo.svg" className="" />
          </div>
          <div className="flex justify-center mb-4">
            <CheckCircle2Icon className="text-green-500 w-10 h-10 mb-4" />
          </div>
          <div className="text-center text-sm opacity-70">
            {t("ffmpegFoundAt", { path: ffmpegConfig.ffmpegPath })}
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
          <div className="mb-4">
            <div className="text-center text-sm mb-2">
              {t("ffmpegNotFound")}
            </div>

            {scanResult && (
              <div className="text-center text-xs text-muted-foreground mb-2">
                {t("tryingToFindValidFFmepgInTheseDirectories", {
                  dirs: scanResult.scanDirs.join(", "),
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center space-x-4  mb-4">
            <Button onClick={discoverFfmpeg} variant="default">
              {t("scan")}
            </Button>

            {ffmpegConfig.os === "win32" && (
              <Button
                variant="secondary"
                disabled={downloading}
                onClick={downloadFfmpeg}
              >
                {downloading && <LoaderIcon className="animate-spin mr-2" />}
                {t("download")}
              </Button>
            )}
          </div>

          {downloading && (
            <div className="w-full">
              <Progress value={progress} />
            </div>
          )}

          {ffmpegConfig.os === "darwin" && (
            <div className="my-6 select-text prose mx-auto border rounded-lg p-4">
              <h3 className="text-center">{t("ffmpegInstallSteps")}</h3>
              <h4>
                1. {t("install")}{" "}
                <a
                  className="cursor-pointer text-blue-500 hover:underline"
                  onClick={() => {
                    EnjoyApp.shell.openExternal("https://brew.sh/");
                  }}
                >
                  Homebrew
                </a>
              </h4>
              <p>{t("runTheFollowingCommandInTerminal")} </p>
              <pre>
                <code>
                  /bin/bash -c "$(curl -fsSL
                  https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                </code>
              </pre>

              <h4>2. {t("install")} FFmpeg</h4>

              <p>{t("runTheFollowingCommandInTerminal")} </p>
              <pre>
                <code>brew install ffmpeg</code>
              </pre>

              <h4>3. {t("scan")} FFmpeg</h4>
              <p>
                {t("click")}
                <Button
                  onClick={discoverFfmpeg}
                  variant="default"
                  size="sm"
                  className="mx-2"
                >
                  {t("scan")}
                </Button>
                , {t("willAutomaticallyFindFFmpeg")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
