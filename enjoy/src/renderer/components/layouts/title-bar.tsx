import { AppSettingsProviderContext } from "@/renderer/context";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
} from "@renderer/components/ui";
import { IpcRendererEvent } from "electron/renderer";
import { t } from "i18next";
import {
  MaximizeIcon,
  MenuIcon,
  MinimizeIcon,
  MinusIcon,
  XIcon,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";

export const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [platform, setPlatform] = useState<"darwin" | "win32" | "linux">();

  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const onWindowChange = (
    event: IpcRendererEvent,
    state: { event: string }
  ) => {
    if (state.event === "maximize") {
      setIsMaximized(true);
    } else if (state.event === "unmaximize") {
      setIsMaximized(false);
    }
  };

  useEffect(() => {
    EnjoyApp.window.onChange(onWindowChange);
    EnjoyApp.app.getPlatformInfo().then((info) => {
      setPlatform(info.platform as "darwin" | "win32" | "linux");
    });

    return () => {
      EnjoyApp.window.removeListener(onWindowChange);
    };
  }, []);

  return (
    <div className="z-50 h-8 w-full bg-muted draggable-region flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-none non-draggable-region hover:bg-primary/10"
        >
          <MenuIcon className="size-4" />
        </Button>
      </div>

      {platform !== "darwin" && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none non-draggable-region hover:bg-primary/10"
            onClick={() => EnjoyApp.window.minimize()}
          >
            <MinusIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-none non-draggable-region hover:bg-primary/10"
            onClick={() => EnjoyApp.window.toggleMaximized()}
          >
            {isMaximized ? (
              <MinimizeIcon className="size-4" />
            ) : (
              <MaximizeIcon className="size-4" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-none non-draggable-region hover:bg-destructive"
              >
                <XIcon className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("quitApp")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("quitAppDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => EnjoyApp.window.close()}
                >
                  {t("quit")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
