import { t } from "i18next";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
  Separator,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { InfoIcon } from "lucide-react";
import { humanFileSize } from "@/utils";

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

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("libraryPath")}</div>
        <div className="text-sm text-muted-foreground mb-2">{libraryPath}</div>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                {t("detail")}
              </Button>
            </DialogTrigger>
            <DialogContent className="h-3/5">
              <DialogHeader>
                <DialogTitle>{t("usage")}</DialogTitle>
                <DialogDescription className="sr-only">
                  Disk usage of Enjoy
                </DialogDescription>
              </DialogHeader>
              <div className="h-full overflow-hidden">
                <ScrollArea className="h-full px-4">
                  <DiskUsage />
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
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

const DiskUsage = () => {
  const [usage, setUsage] = useState<DiskUsageType>([]);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const openPath = async (filePath: string) => {
    console.log(filePath);

    if (filePath?.match(/.+\.json$/)) {
      await EnjoyApp.shell.openPath(filePath.split("/").slice(0, -1).join("/"));
    } else if (filePath) {
      await EnjoyApp.shell.openPath(filePath);
    }
  };

  useEffect(() => {
    EnjoyApp.app.diskUsage().then((usage) => {
      console.log(usage);
      setUsage(usage);
    });
  }, []);

  return (
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
  );
};
