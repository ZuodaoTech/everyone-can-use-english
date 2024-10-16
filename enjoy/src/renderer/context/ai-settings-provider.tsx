import { createContext, useEffect, useState, useContext } from "react";
import {
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { SttEngineOptionEnum, UserSettingKeyEnum } from "@/types/enums";
import { GPT_PROVIDERS, TTS_PROVIDERS } from "@renderer/components";
import { WHISPER_MODELS } from "@/constants";

type AISettingsProviderState = {
  sttEngine?: SttEngineOptionEnum;
  setSttEngine?: (name: string) => Promise<void>;
  whisperModel?: string;
  setWhisperModel?: (name: string) => void;
  openai?: LlmProviderType;
  setOpenai?: (config: LlmProviderType) => void;
  setGptEngine?: (engine: GptEngineSettingType) => void;
  currentGptEngine?: GptEngineSettingType;
  currentTtsEngine?: TtsEngineSettingType;
  gptProviders?: typeof GPT_PROVIDERS;
  ttsProviders?: typeof TTS_PROVIDERS;
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
  const [whisperModel, setWhisperModel] = useState<string>(null);
  const [sttEngine, setSttEngine] = useState<SttEngineOptionEnum>(
    SttEngineOptionEnum.ENJOY_AZURE
  );
  const { EnjoyApp, libraryPath, user, apiUrl, webApi, learningLanguage } =
    useContext(AppSettingsProviderContext);
  const [gptProviders, setGptProviders] = useState<any>(GPT_PROVIDERS);
  const [ttsProviders, setTtsProviders] = useState<any>(TTS_PROVIDERS);
  const db = useContext(DbProviderContext);

  const refreshGptProviders = async () => {
    let providers = GPT_PROVIDERS;

    try {
      const config = await webApi.config("gpt_providers");
      providers = Object.assign(providers, config);
    } catch (e) {
      console.warn(`Failed to fetch remote GPT config: ${e.message}`);
    }

    try {
      const response = await fetch(providers["ollama"]?.baseUrl + "/api/tags");
      providers["ollama"].models = (await response.json()).models.map(
        (m: any) => m.name
      );
    } catch (e) {
      console.warn(`No ollama server found: ${e.message}`);
    }

    if (openai?.models) {
      providers["openai"].models = openai.models.split(",");
    }

    setGptProviders({ ...providers });
  };

  const refreshTtsProviders = async () => {
    let providers = TTS_PROVIDERS;

    try {
      const config = await webApi.config("tts_providers_v2");
      providers = Object.assign(providers, config);
    } catch (e) {
      console.warn(`Failed to fetch remote TTS config: ${e.message}`);
    }

    setTtsProviders({ ...providers });
  };

  const refreshWhisperModel = async () => {
    const model = await EnjoyApp.userSettings.get(UserSettingKeyEnum.WHISPER);
    if (WHISPER_MODELS.includes(model)) {
      setWhisperModel(model);
    } else if (model.match(/tiny/)) {
      setWhisperModel("tiny");
    } else if (model.match(/base/)) {
      setWhisperModel("base");
    } else if (model.match(/small/)) {
      setWhisperModel("small");
    } else if (model.match(/medium/)) {
      setWhisperModel("medium");
    } else if (model.match(/large/)) {
      setWhisperModel("large-v3-turbo");
    }
  };

  const handleSetWhisperModel = async (name: string) => {
    if (WHISPER_MODELS.includes(name)) {
      setWhisperModel(name);
      EnjoyApp.userSettings.set(UserSettingKeyEnum.WHISPER, name);
    }
  };

  useEffect(() => {
    refreshGptProviders();
    refreshTtsProviders();
  }, [openai, gptEngine]);

  useEffect(() => {
    if (db.state !== "connected") return;

    fetchSettings();
  }, [db.state]);

  useEffect(() => {
    if (db.state !== "connected") return;
    if (!libraryPath) return;
  }, [db.state, libraryPath]);

  const handleSetSttEngine = async (name: SttEngineOptionEnum) => {
    setSttEngine(name);
    return EnjoyApp.userSettings.set(UserSettingKeyEnum.STT_ENGINE, name);
  };

  const fetchSettings = async () => {
    const _sttEngine = await EnjoyApp.userSettings.get(
      UserSettingKeyEnum.STT_ENGINE
    );
    if (_sttEngine) {
      setSttEngine(_sttEngine);
    }

    const _openai = await EnjoyApp.userSettings.get(UserSettingKeyEnum.OPENAI);
    if (_openai) {
      setOpenai(Object.assign({ name: "openai" }, _openai));
    }

    const _gptEngine = await EnjoyApp.userSettings.get(
      UserSettingKeyEnum.GPT_ENGINE
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
      EnjoyApp.userSettings
        .set(UserSettingKeyEnum.GPT_ENGINE, engine)
        .then(() => {
          setGptEngine(engine);
        });
    } else {
      const engine = {
        name: "enjoyai",
        models: {
          default: "gpt-4o",
        },
      };
      EnjoyApp.userSettings
        .set(UserSettingKeyEnum.GPT_ENGINE, engine)
        .then(() => {
          setGptEngine(engine);
        });
    }

    refreshWhisperModel();
  };

  const handleSetOpenai = async (config: LlmProviderType) => {
    await EnjoyApp.userSettings.set(UserSettingKeyEnum.OPENAI, config);
    setOpenai(Object.assign({ name: "openai" }, config));
  };

  return (
    <AISettingsProviderContext.Provider
      value={{
        setGptEngine: (engine: GptEngineSettingType) => {
          EnjoyApp.userSettings
            .set(UserSettingKeyEnum.GPT_ENGINE, engine)
            .then(() => {
              setGptEngine(engine);
            });
        },
        currentGptEngine:
          gptEngine.name === "openai"
            ? Object.assign(gptEngine, {
                key: openai.key,
                baseUrl: openai.baseUrl,
              })
            : Object.assign(gptEngine, {
                key: user?.accessToken,
                baseUrl: `${apiUrl}/api/ai`,
              }),
        currentTtsEngine:
          gptEngine.name === "openai"
            ? {
                name: "openai",
                model: "tts-1",
                voice: "alloy",
                language: learningLanguage,
              }
            : {
                name: "enjoyai",
                model: "openai/tts-1",
                voice: "alloy",
                language: learningLanguage,
              },
        openai,
        setOpenai: (config: LlmProviderType) => handleSetOpenai(config),
        whisperModel,
        setWhisperModel: handleSetWhisperModel,
        sttEngine,
        setSttEngine: (name: SttEngineOptionEnum) => handleSetSttEngine(name),
        gptProviders,
        ttsProviders,
      }}
    >
      {children}
    </AISettingsProviderContext.Provider>
  );
};
