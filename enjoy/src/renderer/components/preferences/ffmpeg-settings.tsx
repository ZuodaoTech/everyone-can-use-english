import { t } from "i18next";
import { Button, toast } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState } from "react";
import { EditIcon } from "lucide-react";

export const FfmpegSettings = () => {
  const { EnjoyApp, setFfmegConfig, ffmpegConfig } = useContext(
    AppSettingsProviderContext
  );
  const [editing, setEditing] = useState(false);

  const refreshFfmpegConfig = async () => {
    EnjoyApp.ffmpeg.config().then((config) => {
      setFfmegConfig(config);
    });
  };

  const handleChooseFfmpeg = async () => {
    const filePaths = await EnjoyApp.dialog.showOpenDialog({
      properties: ["openFile"],
    });

    const path = filePaths?.[0];
    if (!path) return;

    if (path.includes("ffmpeg")) {
      EnjoyApp.ffmpeg.setConfig({
        ...ffmpegConfig,
        ffmpegPath: path,
      });
      refreshFfmpegConfig();
    } else if (path.includes("ffprobe")) {
      EnjoyApp.ffmpeg.setConfig({
        ...ffmpegConfig,
        ffprobePath: path,
      });
      refreshFfmpegConfig();
    } else {
      toast.error(t("invalidFfmpegPath"));
    }
  };

  return (
    <>
      <div className="flex items-start justify-between py-4">
        <div className="">
          <div className="mb-2">FFmpeg</div>
          {editing ? (
            <>
              <div className="flex items-center space-x-4">
                <span className=" text-sm text-muted-foreground">
                  <b>ffmpeg</b>: {ffmpegConfig?.ffmpegPath || ""}
                </span>
                <Button
                  onClick={handleChooseFfmpeg}
                  variant="ghost"
                  size="icon"
                >
                  <EditIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <span className=" text-sm text-muted-foreground">
                  <b>ffprobe</b>: {ffmpegConfig?.ffprobePath || ""}
                </span>
                <Button
                  onClick={handleChooseFfmpeg}
                  variant="ghost"
                  size="icon"
                >
                  <EditIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              {ffmpegConfig.ready ? (
                <span>{t("ffmpegCommandIsWorking")}</span>
              ) : (
                <span>{t("ffmpegCommandIsNotWorking")}</span>
              )}
            </div>
          )}
        </div>
        <div className="">
          <div className="flex items-center justify-end space-x-2 mb-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                EnjoyApp.ffmpeg
                  .discover()
                  .then(({ ffmpegPath, ffprobePath }) => {
                    if (ffmpegPath && ffprobePath) {
                      toast.success(
                        t("ffmpegFoundAt", {
                          path: ffmpegPath + ", " + ffprobePath,
                        })
                      );
                    } else {
                      toast.warning(t("ffmpegNotFound"));
                    }
                    refreshFfmpegConfig();
                  });
              }}
            >
              {t("scan")}
            </Button>
            <Button
              variant={editing ? "outline" : "secondary"}
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? t("cancel") : t("edit")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
