import { t } from "i18next";
import { useContext } from "react";
import { Button, Input, Label } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";

export const ChooseLibraryPathInput = () => {
  const { libraryPath, setLibraryPath, EnjoyApp } = useContext(
    AppSettingsProviderContext
  );

  const handleChooseLibraryPath = async () => {
    const filePaths = await EnjoyApp.dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (filePaths) {
      EnjoyApp.settings.setLibrary(filePaths[0]);
      setLibraryPath(await EnjoyApp.settings.getLibrary());
    }
  };

  const openLibraryPath = async () => {
    if (libraryPath) {
      await EnjoyApp.shell.openPath(libraryPath);
    }
  };

  return (
    <div className="grid gap-1.5 w-full max-w-sm">
      <Label htmlFor="library-path">{t("libraryPath")}</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="library-path"
          value={libraryPath}
          disabled
          className="cursor-pointer!"
        />
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={openLibraryPath}
            className="min-w-max"
          >
            {t("open")}
          </Button>
          <Button onClick={handleChooseLibraryPath} className="min-w-max">
            {t("select")}
          </Button>
        </div>
      </div>
    </div>
  );
};
