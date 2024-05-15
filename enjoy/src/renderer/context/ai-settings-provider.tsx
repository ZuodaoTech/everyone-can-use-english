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
  setGptEngine?: (engine: GptEngineSettingType) => void;
  currentEngine?: GptEngineSettingType;
};

const initialState: AISettingsProviderState = {};

export const AISettingsProviderContext =
  createContext<AISettingsProviderState>(initialState);

export const AISettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [gptEngine, setGptEngine] = useState<GptEngineSettingType>({
    name: "enjoyai",
    models: {
      default: "gpt-4o",
    },
  });
  const [openai, setOpenai] = useState<LlmProviderType>(null);
  const [googleGenerativeAi, setGoogleGenerativeAi] =
    useState<LlmProviderType>(null);
  const [whisperConfig, setWhisperConfig] = useState<WhisperConfigType>(null);
  const { EnjoyApp, libraryPath, user, apiUrl } = useContext(
    AppSettingsProviderContext
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!libraryPath) return;

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
    const _gptEngine = await EnjoyApp.settings.getGptEngine();
    if (_gptEngine) {
      setGptEngine(_gptEngine);
    } else if (_defaultEngine) {
      // Migrate default engine to gpt engine
      const engine = {
        name: _defaultEngine,
        models: {
          default: "gpt-4o",
        },
      };
      EnjoyApp.settings.setGptEngine(engine).then(() => {
        setGptEngine(engine);
      });
    } else if (_openai?.key) {
      const engine = {
        name: "openai",
        models: {
          default: "gpt-4o",
        },
      };
      EnjoyApp.settings.setGptEngine(engine).then(() => {
        setGptEngine(engine);
      });
    } else {
      const engine = {
        name: "enjoyai",
        models: {
          default: "gpt-4o",
        },
      };
      EnjoyApp.settings.setGptEngine(engine).then(() => {
        setGptEngine(engine);
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
        setGptEngine: (engine: GptEngineSettingType) => {
          EnjoyApp.settings.setGptEngine(engine).then(() => {
            setGptEngine(engine);
          });
        },
        currentEngine:
          gptEngine.name === "openai"
            ? Object.assign(gptEngine, {
                key: openai.key,
                baseUrl: openai.baseUrl,
              })
            : Object.assign(gptEngine, {
                key: user?.accessToken,
                baseUrl: `${apiUrl}/api/ai`,
              }),
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
