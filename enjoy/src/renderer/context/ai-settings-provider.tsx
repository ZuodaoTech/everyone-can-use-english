import { createContext, useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

type AISettingsProviderState = {
  setWhisperModel?: (name: string) => Promise<void>;
  setWhisperService?: (name: string) => Promise<void>;
  whisperConfig?: WhisperConfigType;
  refreshWhisperConfig?: () => void;
  openai?: LlmProviderType;
  setOpenai?: (config: LlmProviderType) => void;
  googleGenerativeAi?: LlmProviderType;
  setGoogleGenerativeAi?: (config: LlmProviderType) => void;
  defaultEngine?: string;
  setDefaultEngine?: (engine: string) => void;
  currentEngine?: LlmProviderType;
};

const initialState: AISettingsProviderState = {};

export const AISettingsProviderContext =
  createContext<AISettingsProviderState>(initialState);

export const AISettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [defaultEngine, setDefaultEngine] = useState<string>(null);
  const [openai, setOpenai] = useState<LlmProviderType>(null);
  const [googleGenerativeAi, setGoogleGenerativeAi] =
    useState<LlmProviderType>(null);
  const [whisperConfig, setWhisperConfig] = useState<WhisperConfigType>(null);
  const { EnjoyApp, apiUrl, user, libraryPath } = useContext(
    AppSettingsProviderContext
  );

  useEffect(() => {
    fetchSettings();
    refreshWhisperConfig();
  }, []);

  useEffect(() => {
    refreshWhisperConfig();
  }, [libraryPath]);

  const refreshWhisperConfig = async () => {
    const config = await EnjoyApp.whisper.config();
    setWhisperConfig(config);
  };

  const setWhisperModel = async (name: string) => {
    return EnjoyApp.whisper.setModel(name).then((config) => {
      if (!config) return;
      setWhisperConfig(config);
    });
  };

  const setWhisperService = async (name: WhisperConfigType["service"]) => {
    return EnjoyApp.whisper.setService(name).then((config) => {
      if (!config) return;
      setWhisperConfig(config);
    });
  };

  const fetchSettings = async () => {
    const _openai = await EnjoyApp.settings.getLlm("openai");
    if (_openai) {
      setOpenai(Object.assign({ name: "openai" }, _openai));
    }

    const _googleGenerativeAi = await EnjoyApp.settings.getLlm(
      "googleGenerativeAi"
    );
    if (_googleGenerativeAi) {
      setGoogleGenerativeAi(
        Object.assign({ name: "googleGenerativeAi" }, _googleGenerativeAi)
      );
    }

    const _defaultEngine = await EnjoyApp.settings.getDefaultEngine();
    if (_defaultEngine) {
      setDefaultEngine(_defaultEngine);
    } else if (_openai?.key) {
      EnjoyApp.settings.setDefaultEngine("openai").then(() => {
        setDefaultEngine("openai");
      });
    } else {
      EnjoyApp.settings.setDefaultEngine("enjoyai").then(() => {
        setDefaultEngine("enjoyai");
      });
    }
  };

  const handleSetLlm = async (
    name: SupportedLlmProviderType,
    config: LlmProviderType
  ) => {
    await EnjoyApp.settings.setLlm(name, config);
    const _config = await EnjoyApp.settings.getLlm(name);

    switch (name) {
      case "openai":
        setOpenai(Object.assign({ name: "openai" }, _config));
        break;
      case "googleGenerativeAi":
        setGoogleGenerativeAi(
          Object.assign({ name: "googleGenerativeAi" }, _config)
        );
        break;
    }
  };

  return (
    <AISettingsProviderContext.Provider
      value={{
        defaultEngine,
        setDefaultEngine: (engine: "openai" | "enjoyai") => {
          EnjoyApp.settings.setDefaultEngine(engine).then(() => {
            setDefaultEngine(engine);
          });
        },
        currentEngine: {
          openai: openai,
          enjoyai: {
            name: "enjoyai" as LlmProviderType["name"],
            key: user?.accessToken,
            baseUrl: `${apiUrl}/api/ai`,
          },
        }[defaultEngine],
        openai,
        setOpenai: (config: LlmProviderType) => handleSetLlm("openai", config),
        googleGenerativeAi,
        setGoogleGenerativeAi: (config: LlmProviderType) =>
          handleSetLlm("googleGenerativeAi", config),
        whisperConfig,
        refreshWhisperConfig,
        setWhisperModel,
        setWhisperService,
      }}
    >
      {children}
    </AISettingsProviderContext.Provider>
  );
};
