import { t } from "i18next";
import { Separator } from "@renderer/components/ui";
import { HotKeysSettingsProviderContext, Hotkey } from "@/renderer/context";
import { useContext, useState } from "react";
import { ChangeHotkeyDialog } from "../change-hotkey-dialog";

export const Hotkeys = () => {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    keyName: string;
  } | null>(null);
  const {
    currentHotkeys,
    startRecordingHotkeys,
    stopRecordingHotkeys,
  } = useContext(HotKeysSettingsProviderContext);

  const commandOrCtrl = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";

  const handleItemSelected = (item: { name: string; keyName: Hotkey }) => {
    setOpen(true);
    startRecordingHotkeys();
    setSelectedItem(item);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      stopRecordingHotkeys();
    }
  };

  return (
    <>
      <div className="font-semibold mb-4 capitilized">{t("hotkeys")}</div>
      <div className="mb-6">
        <div className="text-sm text-muted-foreground">{t("system")}</div>

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">{t("quitApp")}</div>
          <kbd className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-not-allowed">
            {commandOrCtrl} + Q
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            {t("openPreferences")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: "Open preferences",
                keyName: "OpenPreferences",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
          >
            {currentHotkeys.OpenPreferences}
          </kbd>
        </div>
        <Separator />
      </div>

      <div className="mb-6">
        <div className="text-sm text-muted-foreground">{t("player")}</div>

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">{t("playOrPause")}</div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("playOrPause"),
                keyName: "PlayOrPause",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
          >
            {currentHotkeys.PlayOrPause}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2 capitalize">
            {t("startOrStopRecording")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("startOrStopRecording"),
                keyName: "StartOrStopRecording",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground"
          >
            {currentHotkeys.StartOrStopRecording}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            {t("playOrPauseRecording")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("playOrPauseRecording"),
                keyName: "PlayOrPauseRecording",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground"
          >
            {currentHotkeys.PlayOrPauseRecording}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2 capitalize">
            {t("playPreviousSegment")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("playPreviousSegment"),
                keyName: "PlayPreviousSegment",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground"
          >
            {currentHotkeys.PlayPreviousSegment}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2 capitalize">
            {t("playNextSegment")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("playNextSegment"),
                keyName: "PlayNextSegment",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground"
          >
            {currentHotkeys.PlayNextSegment}
          </kbd>
        </div>
        <Separator />
      </div>

      <ChangeHotkeyDialog
        open={open}
        keyName={selectedItem?.keyName}
        name={selectedItem?.name}
        onOpenChange={handleOpenChange}
      />
    </>
  );
};
