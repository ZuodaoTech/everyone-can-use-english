import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@renderer/components/ui";
import { toast } from "@renderer/components/ui";
import { useContext, useMemo } from "react";
import { HotKeysSettingsProviderContext } from "../context";
import { CheckIcon, KeyboardIcon, XIcon } from "lucide-react";
import { t } from "i18next";

export const ChangeHotkeyDialog = ({
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
  } = useContext(HotKeysSettingsProviderContext);

  const joinedKeys = useMemo(() => [...recordingHotkeys].join("+"), [
    recordingHotkeys,
  ]);

  const changeKeyMap = async () => {
    const ret = ((await changeHotkey(
      keyName,
      recordingHotkeys
    )) as unknown) as {
      error: "conflict" | "invalid";
      data: string | string[];
      input: string;
    };
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
    }
  };

  const clear = () => {
    resetRecordingHotkeys();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("customizeShortcuts")}</AlertDialogTitle>
        </AlertDialogHeader>
        <div>
          <p className="pb-4">{name}</p>
          <div className="flex items-center">
            <p className="inline-block gap-2 border-2 border-black rounded p-[2px] mr-2">
              {currentHotkeys[keyName]}
            </p>
            {joinedKeys.length > 0 ? (
              <div className="flex items-center gap-1">
                <p className="border-2 border-black rounded p-[2px]">
                  {joinedKeys}
                </p>
                <div className="cursor-pointer" onClick={changeKeyMap}>
                  <CheckIcon className="text-green-500 w-5 h-5" />
                </div>
                <div className="cursor-pointer" onClick={clear}>
                  <XIcon className="text-red-500 w-5 h-5" />
                </div>
              </div>
            ) : (
              <div className="inline-block gap-2 border-2 border-black rounded p-[2px]">
                <span className="text-sm">{t("customizeShortcutsTip")}</span>
                <KeyboardIcon className="inline ml-1 w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
