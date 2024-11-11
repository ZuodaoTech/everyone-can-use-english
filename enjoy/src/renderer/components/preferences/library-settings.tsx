import { t } from "i18next";
import { Button } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext } from "react";
import { InfoIcon } from "lucide-react";

export const LibrarySettings = () => {
  const { libraryPath, EnjoyApp } = useContext(AppSettingsProviderContext);

  const handleChooseLibraryPath = async () => {
    const filePaths = await EnjoyApp.dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (filePaths) {
      EnjoyApp.appSettings.setLibrary(filePaths[0]);
      const _library = await EnjoyApp.appSettings.getLibrary();
      if (_library !== libraryPath) {
        EnjoyApp.app.relaunch();
      }
    }
  };

  const openLibraryDir = () => {
    EnjoyApp.shell.openPath(libraryPath);
  };

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("libraryPath")}</div>
        <div className="text-sm text-muted-foreground mb-2">{libraryPath}</div>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          <Button variant="secondary" size="sm" onClick={openLibraryDir}>
            {t("open")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleChooseLibraryPath}
          >
            {t("edit")}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          <InfoIcon className="mr-1 w-3 h-3 inline" />
          <span>{t("relaunchIsNeededAfterChanged")}</span>
        </div>
      </div>
    </div>
  );
};
