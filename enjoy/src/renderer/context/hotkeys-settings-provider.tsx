import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useHotkeys, useRecordHotkeys } from "react-hotkeys-hook";
import {
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import isEmpty from "lodash/isEmpty";
import { UserSettingKeyEnum } from "@/types/enums";

function isShortcutValid(shortcut: string) {
  const modifiers = ["ctrl", "alt", "shift", "meta"];
  const keys = shortcut.toLowerCase().split("+");
  const modifierCount = keys.filter((key) => modifiers.includes(key)).length;
  const normalKeyCount = keys.length - modifierCount;
  // Validation rule: At most two modifier key, and at most one regular key
  return modifierCount <= 2 && normalKeyCount === 1;
}

function mergeWithPreference(
  a: Record<string, string>, // electron settings's cached value
  b: Record<string, string> // current version's default value
): Record<string, string> {
  const c: Record<string, string> = {};

  for (const key in b) {
    c[key] = b[key];
  }

  for (const key in a) {
    if (key in b) {
      c[key] = a[key];
    }
  }

  return c;
}

const ControlOrCommand = navigator.userAgent.includes("Mac")
  ? "Meta"
  : "Control";

const defaultKeyMap = {
  // system
  QuitApp: `${ControlOrCommand}+Q`,
  OpenPreferences: `${ControlOrCommand}+Comma`,
  OpenCopilot: `${ControlOrCommand}+L`,
  // player
  PlayOrPause: "Space",
  StartOrStopRecording: "R",
  PlayOrPauseRecording: `${ControlOrCommand}+R`,
  PlayPreviousSegment: "P",
  PlayNextSegment: "N",
  Compare: "C",
  PronunciationAssessment: "A",
  IncreasePlaybackRate: "]",
  DecreasePlaybackRate: "[",
  // dev tools
  OpenDevTools: `${ControlOrCommand}+Shift+I`,
};

export type Hotkey = keyof typeof defaultKeyMap;

function checkKeyAndValue(
  key: Hotkey,
  value: string,
  shortcuts: typeof defaultKeyMap
) {
  const inputValue = value.toLowerCase();

  const conflictKeys = Object.keys(shortcuts).filter(
    (k: Hotkey) => shortcuts[k].toLowerCase() === inputValue && k !== key
  );

  return conflictKeys;
}

type HotkeysSettingsProviderState = {
  currentHotkeys: Record<string, string>;
  recordingHotkeys?: any;
  enabled: boolean;
  isRecording: boolean;
  startRecordingHotkeys?: () => void;
  stopRecordingHotkeys?: () => void;
  resetRecordingHotkeys?: () => void;
  changeHotkey?: (key: string, recordedHotkeys: Set<string>) => void;
};

const initialState: HotkeysSettingsProviderState = {
  currentHotkeys: {},
  enabled: true,
  isRecording: false,
};

export const HotKeysSettingsProviderContext =
  createContext<HotkeysSettingsProviderState>(initialState);

const HotKeysSettingsSystemSettings = ({
  currentHotkeys,
  enabled,
  children,
}: {
  currentHotkeys: Record<string, string>;
  enabled: boolean;
  children: React.ReactNode;
}) => {
  useHotkeys(
    currentHotkeys.OpenPreferences,
    () => {
      document.getElementById("preferences-button")?.click();
    },
    {
      enabled,
      preventDefault: true,
    }
  );

  useHotkeys(
    currentHotkeys.QuitApp,
    () => {
      window.__ENJOY_APP__.app.quit();
    },
    {
      enabled,
      preventDefault: true,
    }
  );

  useHotkeys(
    currentHotkeys.OpenDevTools,
    () => {
      window.__ENJOY_APP__.app.openDevTools();
    },
    {
      enabled,
      preventDefault: true,
    }
  );
  return children;
};

export const HotKeysSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentHotkeys, setCurrentHotkeys] = useState<any>(
    initialState.currentHotkeys
  );
  const [keys, { start, stop, resetKeys, isRecording }] = useRecordHotkeys();

  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { state: dbState } = useContext(DbProviderContext);

  useEffect(() => {
    if (dbState !== "connected") return;

    fetchSettings();
  }, [dbState]);

  const fetchSettings = async () => {
    const _hotkeys = await EnjoyApp.userSettings.get(
      UserSettingKeyEnum.HOTKEYS
    );
    // During version iterations, there may be added or removed keys.
    const merged = mergeWithPreference(_hotkeys ?? {}, defaultKeyMap);
    await EnjoyApp.userSettings
      .set(UserSettingKeyEnum.HOTKEYS, merged)
      .then(() => {
        setCurrentHotkeys(merged);
      });
  };

  const changeHotkey = useCallback(
    async (
      keyName: Hotkey,
      recordedHotkeys: Set<string>
    ): Promise<{
      error: "conflict" | "invalid";
      data: string | string[];
      input: string;
    } | void> => {
      const keys = [...recordedHotkeys].slice(0, 3).filter(Boolean);
      const str = keys.join("+");
      const newMap = {
        ...currentHotkeys,
        [keyName]: str,
      };

      // validate
      const conflictKeys = checkKeyAndValue(keyName, str, currentHotkeys);
      if (conflictKeys.length > 0) {
        resetKeys();
        return {
          error: "conflict",
          data: conflictKeys,
          input: str,
        };
      }
      const isValid = isShortcutValid(str);
      if (!isValid) {
        resetKeys();
        return {
          error: "invalid",
          data: str,
          input: str,
        };
      }

      await EnjoyApp.userSettings
        .set(UserSettingKeyEnum.HOTKEYS, newMap)
        .then(() => {
          setCurrentHotkeys(newMap);
        });
      resetKeys();
    },
    [currentHotkeys]
  );

  const startRecordingHotkeys = () => {
    start();
  };

  const stopRecordingHotkeys = () => {
    stop();
    resetKeys();
  };

  return (
    <HotKeysSettingsProviderContext.Provider
      value={{
        currentHotkeys,
        recordingHotkeys: keys,
        enabled: !isRecording,
        isRecording,
        startRecordingHotkeys,
        stopRecordingHotkeys,
        resetRecordingHotkeys: resetKeys,
        changeHotkey,
      }}
    >
      {isEmpty(currentHotkeys) ? (
        children
      ) : (
        <HotKeysSettingsSystemSettings
          {...{
            currentHotkeys,
            enabled: !isRecording,
          }}
        >
          {children}
        </HotKeysSettingsSystemSettings>
      )}
    </HotKeysSettingsProviderContext.Provider>
  );
};
