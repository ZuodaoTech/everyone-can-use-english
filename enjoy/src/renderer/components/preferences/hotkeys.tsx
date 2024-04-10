import { t } from "i18next";
import {
  Separator,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  toast,
} from "@renderer/components/ui";
import { HotKeysSettingsProviderContext, Hotkey } from "@/renderer/context";
import { useContext, useState, useMemo, useEffect } from "react";

export const Hotkeys = () => {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    keyName: string;
  } | null>(null);
  const { currentHotkeys } = useContext(HotKeysSettingsProviderContext);

  const commandOrCtrl = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";

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
                name: t("openPreferences"),
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
          >
            {currentHotkeys.PlayNextSegment}
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
            className="bg-muted px-2 py-1 rounded-md text-sm text-muted-foreground cursor-pointer"
          >
            {currentHotkeys.Compare}
          </kbd>
        </div>

        <Separator />
      </div>

      <ChangeHotkeyDialog
        open={open}
        keyName={selectedItem?.keyName}
        name={selectedItem?.name}
        onOpenChange={setOpen}
      />
    </>
  );
};

const ChangeHotkeyDialog = ({
  open,
  name,
  keyName,
  onOpenChange,
}: {
  open: boolean;
  name: string;
  keyName: string;
  onOpenChange: (open: boolean) => void;
}) => {
  const {
    changeHotkey,
    currentHotkeys,
    recordingHotkeys,
    resetRecordingHotkeys,
    startRecordingHotkeys,
    stopRecordingHotkeys,
  } = useContext(HotKeysSettingsProviderContext);
  const [isRecording, setIsRecording] = useState(false);

  const joinedKeys = useMemo(
    () => [...recordingHotkeys].join("+"),
    [recordingHotkeys]
  );

  const changeKeyMap = async () => {
    const ret = (await changeHotkey(keyName, recordingHotkeys)) as unknown as {
      error: "conflict" | "invalid";
      data: string | string[];
      input: string;
    };
    setIsRecording(false);
    const { error, data, input } = ret ?? {};

    if (error === "conflict") {
      toast.error(
        t("customizeShortcutsConflictToast", {
          input,
          otherHotkeyName: (data as string[]).join(","),
        })
      );
    } else if (error === "invalid") {
      toast.error(t("customizeShortcutsInvalidToast"));
    } else {
      toast.success(t("customizeShortcutsUpdated"));
      onOpenChange(false);
    }
  };

  const clear = () => {
    resetRecordingHotkeys();
    setIsRecording(false);
  };

  useEffect(() => {
    if (isRecording) {
      startRecordingHotkeys();
    } else {
      stopRecordingHotkeys();
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      setIsRecording(false);
    };
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{name}</AlertDialogTitle>
        </AlertDialogHeader>
        <div>
          {isRecording ? (
            <div className="">
              <div className="flex justify-center mb-4">
                <Button variant="secondary">
                  {joinedKeys.length > 0 ? (
                    <span className="text-sm">{joinedKeys}</span>
                  ) : (
                    <span className="font-mono">-</span>
                  )}
                </Button>
              </div>
              <div className="py-2 text-center text-sm text-muted-foreground">{t("customizeShortcutsRecordingTip")}</div>
            </div>
          ) : (
            <div className="">
              <div className="flex justify-center mb-4">
                <Button
                  variant="outline"
                  className="font-mono"
                  onClick={() => {
                    setIsRecording(true);
                  }}
                >
                  {currentHotkeys[keyName]}
                </Button>
              </div>
              <div className="py-2 text-center text-sm text-muted-foreground">{t("customizeShortcutsTip")}</div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <Button disabled={!isRecording || !joinedKeys} onClick={changeKeyMap}>
            {t("save")}
          </Button>
          <AlertDialogCancel onClick={clear}>{t("cancel")}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
