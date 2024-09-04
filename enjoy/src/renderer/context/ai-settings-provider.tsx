import { createContext, useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

type AISettingsProviderState = {
  setWhisperModel?: (name: string) => Promise<void>;
  setWhisperService?: (name: string) => Promise<void>;
  whisperConfig?: WhisperConfigType;
  refreshWhisperConfig?: () => void;
  openai?: LlmProviderType;
  setOpenai?: (config: LlmProviderType) => void;
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
    const _openai = await EnjoyApp.userSettings.get(UserSettingKey.OPENAI);
    if (_openai) {
      setOpenai(Object.assign({ name: "openai" }, _openai));
    }

    const _gptEngine = await EnjoyApp.userSettings.get(
      UserSettingKey.GPT_ENGINE
    );
    if (_gptEngine) {
      setGptEngine(_gptEngine);
    } else if (_openai?.key) {
      const engine = {
        name: "openai",
        models: {
          default: "gpt-4o",
        },
      };
      EnjoyApp.userSettings.set(UserSettingKey.GPT_ENGINE, engine).then(() => {
        setGptEngine(engine);
      });
    } else {
      const engine = {
        name: "enjoyai",
        models: {
          default: "gpt-4o",
        },
      };
      EnjoyApp.userSettings.set(UserSettingKey.GPT_ENGINE, engine).then(() => {
        setGptEngine(engine);
      });
    }
  };

  const handleSetOpenai = async (config: LlmProviderType) => {
    await EnjoyApp.userSettings.set(UserSettingKey.OPENAI, config);
    setOpenai(Object.assign({ name: "openai" }, config));
  };

  return (
    <AISettingsProviderContext.Provider
      value={{
        setGptEngine: (engine: GptEngineSettingType) => {
          EnjoyApp.userSettings
            .set(UserSettingKey.GPT_ENGINE, engine)
            .then(() => {
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
        setOpenai: (config: LlmProviderType) => handleSetOpenai(config),
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
