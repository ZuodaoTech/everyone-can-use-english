import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";

type DictProviderState = {
  settings: DictSettingType;
  dicts: Dict[];
  downloadingDicts: Dict[];
  uninstallDicts: Dict[];
  installedDicts: Dict[];
  dictSelectItems: { text: string; value: string }[];
  reload?: () => void;
  remove?: (v: Dict) => void;
  removed?: (v: Dict) => void;
  currentDict?: Dict | null;
  currentDictValue?: string;
  handleSetCurrentDict?: (v: string) => void;
  setDefault?: (v: Dict) => Promise<void>;
};

const AIDict = {
  text: t("aiLookup"),
  value: "ai",
};

const initialState: DictProviderState = {
  dicts: [],
  downloadingDicts: [],
  uninstallDicts: [],
  installedDicts: [],
  dictSelectItems: [AIDict],
  settings: {
    default: "",
    removing: [],
  },
};

export const DictProviderContext =
  createContext<DictProviderState>(initialState);

export const DictProvider = ({ children }: { children: React.ReactNode }) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [dicts, setDicts] = useState<Dict[]>([]);
  const [settings, setSettings] = useState<DictSettingType>({
    default: "",
    removing: [],
  });
  const [currentDictValue, setCurrentDictValue] = useState<string>("");
  const [currentDict, setCurrentDict] = useState<Dict | null>();

  const availableDicts = useMemo(
    () =>
      dicts.filter((dict) => {
        return (
          dict.state === "installed" &&
          !settings.removing?.find((v) => v === dict.name)
        );
      }),
    [dicts, settings]
  );

  const dictSelectItems = useMemo(() => {
    return [
      AIDict,
      ...availableDicts.map((item) => ({
        text: item.title,
        value: item.name,
      })),
    ];
  }, [availableDicts]);

  const downloadingDicts = useMemo(() => {
    return dicts.filter(
      (dict) => dict.state === "downloading" || dict.state === "decompressing"
    );
  }, [dicts]);

  const uninstallDicts = useMemo(() => {
    return dicts.filter((dict) => dict.state === "uninstall");
  }, [dicts]);

  const installedDicts = useMemo(() => {
    return dicts.filter((dict) => dict.state === "installed");
  }, [dicts]);

  useEffect(() => {
    if (availableDicts.length) {
      const _currentDict = availableDicts.find(
        (dict) => dict.name === settings.default
      );

      if (_currentDict) {
        handleSetCurrentDict(_currentDict.name);
      } else {
        setDefault(availableDicts[0]);
      }
    } else {
      setCurrentDictValue(AIDict.value);
    }
  }, [availableDicts, settings]);

  useEffect(() => {
    fetchSettings();
    fetchDicts();
  }, []);

  const fetchSettings = async () => {
    return EnjoyApp.settings.getDictSettings().then((res) => {
      res && setSettings(res);
    });
  };

  const fetchDicts = async () => {
    return EnjoyApp.dict.getDicts().then((dicts) => {
      setDicts(dicts);
    });
  };

  const handleSetCurrentDict = (value: string) => {
    setCurrentDictValue(value);

    const dict = dicts.find((dict) => dict.name === value);
    if (dict) setCurrentDict(dict);
  };

  const setDefault = async (dict: Dict) => {
    const _settings = { ...settings, default: dict?.name ?? "" };

    EnjoyApp.settings
      .setDictSettings(_settings)
      .then(() => setSettings(_settings));
  };

  const remove = (dict: Dict) => {
    if (!settings.removing?.find((name) => dict.name === name)) {
      const removing = [...(settings.removing ?? []), dict.name];
      const _settings = { ...settings, removing };

      EnjoyApp.settings
        .setDictSettings(_settings)
        .then(() => setSettings(_settings));
    }
  };

  const removed = (dict: Dict) => {
    const removing =
      settings.removing?.filter((name) => name !== dict.name) ?? [];
    const _settings = { ...settings, removing };

    EnjoyApp.settings
      .setDictSettings(_settings)
      .then(() => setSettings(_settings));
  };

  return (
    <DictProviderContext.Provider
      value={{
        settings,
        dicts,
        remove,
        removed,
        reload: fetchDicts,
        dictSelectItems,
        downloadingDicts,
        uninstallDicts,
        installedDicts,
        currentDict,
        currentDictValue,
        handleSetCurrentDict,
        setDefault,
      }}
    >
      {children}
    </DictProviderContext.Provider>
  );
};
