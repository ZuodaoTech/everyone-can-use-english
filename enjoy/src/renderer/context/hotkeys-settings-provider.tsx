import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useHotkeys, useRecordHotkeys } from "react-hotkeys-hook";
import { AppSettingsProviderContext } from "./app-settings-provider";
import _ from "lodash";

function isShortcutValid(shortcut: string) {
  const modifiers = ["ctrl", "alt", "shift", "meta"];
  const keys = shortcut.toLowerCase().split("+");
  const modifierCount = keys.filter((key) => modifiers.includes(key)).length;
  const normalKeyCount = keys.length - modifierCount;
  // Validation rule: At most one modifier key, and at most one regular key
  return modifierCount <= 1 && normalKeyCount === 1;
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

const ControlOrCommand = navigator.platform.includes("Mac")
  ? "Meta"
  : "Control";

const defaultKeyMap = {
  // system
  QuitApp: `${ControlOrCommand}+Q`,
  OpenPreferences: `${ControlOrCommand}+Comma`,
  // player
  PlayOrPause: "Space",
  StartOrStopRecording: "R",
  PlayOrPauseRecording: `${ControlOrCommand}+R`,
  PlayPreviousSegment: "P",
  PlayNextSegment: "N",
  Compare: "C",
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

export const HotKeysSettingsProviderContext = createContext<
  HotkeysSettingsProviderState
>(initialState);

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
    }
  );

  useHotkeys(
    currentHotkeys.QuitApp,
    () => {
      window.__ENJOY_APP__.app.quit();
    },
    {
      enabled,
    }
  );

  useHotkeys(
    currentHotkeys.OpenDevTools,
    () => {
      window.__ENJOY_APP__.app.openDevTools();
    },
    {
      enabled,
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const _hotkeys = await EnjoyApp.settings.getDefaultHotkeys();
    // During version iterations, there may be added or removed keys.
    const merged = mergeWithPreference(_hotkeys ?? {}, defaultKeyMap);
    await EnjoyApp.settings.setDefaultHotkeys(merged).then(() => {
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
      const str = [...recordedHotkeys].join("+");
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

      await EnjoyApp.settings.setDefaultHotkeys(newMap).then(() => {
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
      {_.isEmpty(currentHotkeys) ? null : (
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
