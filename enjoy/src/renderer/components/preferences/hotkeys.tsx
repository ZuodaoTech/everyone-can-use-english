import { t } from "i18next";
import { Separator } from "@renderer/components/ui";
import { HotKeysSettingsProviderContext, Hotkey } from "@renderer/context";
import { HotkeysSettings } from "@renderer/components";
import { useContext, useState } from "react";

export const Hotkeys = () => {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    keyName: string;
  } | null>(null);
  const { currentHotkeys } = useContext(HotKeysSettingsProviderContext);

  const isMac = /Mac/.test(navigator.userAgent);
  const commandOrCtrl = isMac ? "Cmd" : "Ctrl";

  const handleItemSelected = (item: { name: string; keyName: Hotkey }) => {
    setOpen(true);
    setSelectedItem(item);
  };

  return (
    <>
      <div className="font-semibold mb-4 capitilized">{t("hotkeys")}</div>
      <div className="mb-6">
        <div className="text-sm text-muted-foreground">{t("system")}</div>

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">{t("quitApp")}</div>
          <kbd className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-not-allowed capitalize">
            {commandOrCtrl}+Q
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
                name: t("openPreferences"),
                keyName: "OpenPreferences",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer capitalize"
          >
            {currentHotkeys.OpenPreferences}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">{t("openCopilot")}</div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("openCopilot"),
                keyName: "OpenCopilot",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer capitalize"
          >
            {currentHotkeys.OpenCopilot}
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer capitalize"
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer capitalize"
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer capitalize"
          >
            {currentHotkeys.PlayOrPauseRecording}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            {t("pronunciationAssessment")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("pronunciationAssessment"),
                keyName: "PronunciationAssessment",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer capitalize"
          >
            {currentHotkeys.PronunciationAssessment}
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer capitalize"
          >
            {currentHotkeys.PlayNextSegment}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2 capitalize">
            {t("increasePlaybackRate")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("increasePlaybackRate"),
                keyName: "IncreasePlaybackRate",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
          >
            {currentHotkeys.IncreasePlaybackRate}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2 capitalize">
            {t("decreasePlaybackRate")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("decreasePlaybackRate"),
                keyName: "DecreasePlaybackRate",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
          >
            {currentHotkeys.DecreasePlaybackRate}
          </kbd>
        </div>

        <Separator />

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2 capitalize">
            {t("compare")}
          </div>
          <kbd
            onClick={() =>
              handleItemSelected({
                name: t("compare"),
                keyName: "Compare",
              })
            }
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer capitalize"
          >
            {currentHotkeys.Compare}
          </kbd>
        </div>

        <Separator />
      </div>

      <HotkeysSettings
        open={open}
        keyName={selectedItem?.keyName}
        name={selectedItem?.name}
        onOpenChange={setOpen}
      />
    </>
  );
};
