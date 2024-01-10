import { t } from "i18next";
import { Separator } from "@renderer/components/ui";

export const Hotkeys = () => {
  const commandOrCtrl = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";

  return (
    <>
      <div className="font-semibold mb-4 capitilized">{t("hotkeys")}</div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">{t("quitApp")}</div>
        <kbd className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground">
          {commandOrCtrl} + Q
        </kbd>
      </div>
      <Separator />

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">{t("openPreferences")}</div>
        <kbd className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground">
          {commandOrCtrl} + ,
        </kbd>
      </div>
      <Separator />

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">{t("playOrPause")}</div>
        <kbd className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground">
          Space
        </kbd>
      </div>
      <Separator />
    </>
  );
};
