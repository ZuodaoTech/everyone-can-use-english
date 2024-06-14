import { t } from "i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  toast,
} from "@renderer/components/ui";
import { HotKeysSettingsProviderContext } from "@renderer/context";
import { useContext, useMemo, useEffect } from "react";

export const HotkeysSettings = ({
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
    isRecording,
  } = useContext(HotKeysSettingsProviderContext);

  const reset = () => {
    stopRecordingHotkeys();
    resetRecordingHotkeys();
  };

  const joinedKeys = useMemo(() => {
    const keys = [...recordingHotkeys].join("+").split("+");
    if (keys?.length > 3) {
      reset();
      return "";
    } else {
      return keys.join("+");
    }
  }, [recordingHotkeys]);

  const changeKeyMap = async () => {
    const ret = (await changeHotkey(keyName, recordingHotkeys)) as unknown as {
      error: "conflict" | "invalid";
      data: string | string[];
      input: string;
    };
    stopRecordingHotkeys();
    const { error, data, input } = ret ?? {};

    if (error === "conflict") {
      toast.error(
        t("customizeShortcutsConflictToast", {
          input,
          otherHotkeyName: (data as string[])
            .map((str) => t(str.charAt(0).toLowerCase() + str.slice(1)))
            .join(","),
        })
      );
    } else if (error === "invalid") {
      toast.error(t("customizeShortcutsInvalidToast"));
    } else {
      toast.success(t("customizeShortcutsUpdated"));
      onOpenChange(false);
    }
  };

  // ensure recording disabled when dialog close
  useEffect(() => {
    return () => {
      stopRecordingHotkeys();
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
                  {joinedKeys?.length > 0 ? (
                    <span className="text-sm">{joinedKeys}</span>
                  ) : (
                    <span className="font-mono">-</span>
                  )}
                </Button>
              </div>
              <div className="py-2 text-center text-sm text-muted-foreground">
                {t("customizeShortcutsRecordingTip")}
              </div>
            </div>
          ) : (
            <div className="">
              <div className="flex justify-center mb-4">
                <Button
                  variant="outline"
                  className="font-mono"
                  onClick={() => {
                    startRecordingHotkeys();
                  }}
                >
                  {currentHotkeys[keyName]}
                </Button>
              </div>
              <div className="py-2 text-center text-sm text-muted-foreground">
                {t("customizeShortcutsTip")}
              </div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <Button disabled={!isRecording || !joinedKeys} onClick={changeKeyMap}>
            {t("save")}
          </Button>
          <AlertDialogCancel onClick={reset}>{t("cancel")}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
