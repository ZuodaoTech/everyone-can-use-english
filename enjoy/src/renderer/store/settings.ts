import { create } from "zustand";
import { WEB_API_URL } from "@shared/constants";
import { SttEngineOptionEnum, UserSettingKeyEnum } from "@shared/types/enums";
import {
  UserType,
  ProxyConfigType,
  RecorderConfigType,
  VocabularyConfigType,
  GptEngineSettingType,
  LlmProviderType,
  TtsConfigType,
  EchogardenSttConfigType,
} from "./types";
import { Client } from "@shared/api";

interface SettingsState {
  // App settings
  apiUrl: string;
  user: UserType | null;
  initialized: boolean;
  version: string;
  latestVersion: string;
  libraryPath: string;
  language: "en" | "zh-CN";
  nativeLanguage: string;
  learningLanguage: string;
  proxy: ProxyConfigType | null;
  vocabularyConfig: VocabularyConfigType;
  recorderConfig: RecorderConfigType;
  ipaMappings: { [key: string]: string };
  displayPreferences: boolean;
  displayDepositDialog: boolean;

  // AI settings
  sttEngine: SttEngineOptionEnum;
  gptEngine: GptEngineSettingType;
  openai: LlmProviderType | null;
  ttsConfig: TtsConfigType | null;
  echogardenSttConfig: EchogardenSttConfigType | null;

  // Hotkeys
  hotkeys: Record<string, string>;

  // Actions - App settings
  setApiUrl: (url: string) => Promise<void>;
  login: (user: UserType) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  setLibraryPath: (path: string) => Promise<void>;
  switchLanguage: (language: "en" | "zh-CN") => Promise<void>;
  switchNativeLanguage: (lang: string) => Promise<void>;
  switchLearningLanguage: (lang: string) => Promise<void>;
  setProxy: (config: ProxyConfigType) => Promise<void>;
  setVocabularyConfig: (config: VocabularyConfigType) => Promise<void>;
  setRecorderConfig: (config: RecorderConfigType) => Promise<void>;
  setDisplayPreferences: (display: boolean) => void;
  setDisplayDepositDialog: (display: boolean) => void;

  // Actions - AI settings
  setSttEngine: (name: SttEngineOptionEnum) => Promise<void>;
  setGptEngine: (engine: GptEngineSettingType) => Promise<void>;
  setOpenai: (config: LlmProviderType) => Promise<void>;
  setTtsConfig: (config: TtsConfigType) => Promise<void>;
  setEchogardenSttConfig: (config: EchogardenSttConfigType) => Promise<void>;

  // Actions - Hotkeys
  setHotkey: (key: string, value: string) => Promise<void>;

  // Initialization
  initialize: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state - App settings
  apiUrl: WEB_API_URL,
  user: null,
  initialized: false,
  version: "",
  latestVersion: "",
  libraryPath: "",
  language: "en",
  nativeLanguage: "zh-CN",
  learningLanguage: "en-US",
  proxy: null,
  vocabularyConfig: { lookupOnMouseOver: true },
  recorderConfig: {
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000,
    sampleSize: 16,
  },
  ipaMappings: {},
  displayPreferences: false,
  displayDepositDialog: false,

  // Initial state - AI settings
  sttEngine: SttEngineOptionEnum.ENJOY_AZURE,
  gptEngine: {
    name: "enjoyai",
    models: {
      default: "gpt-4o",
    },
  },
  openai: null,
  ttsConfig: null,
  echogardenSttConfig: null,

  // Initial state - Hotkeys
  hotkeys: {},

  // Actions - App settings
  setApiUrl: async (url: string) => {
    await window.__ENJOY_APP__.config.setApiUrl(url);
    set({ apiUrl: url });
  },

  login: async (user: UserType) => {
    await window.__ENJOY_APP__.config.login(user);
    set({ user });
  },

  logout: async () => {
    await window.__ENJOY_APP__.config.logout();
    set({ user: null });
  },

  refreshAccount: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const webApi = new Client({
        baseUrl: get().apiUrl,
        accessToken: user.accessToken,
      });

      const updatedUser = await webApi.me();
      set({ user: { ...user, ...updatedUser } });
    } catch (error) {
      console.error("Failed to refresh account:", error);
    }
  },

  setLibraryPath: async (path: string) => {
    await window.__ENJOY_APP__.config.setLibrary(path);
    set({ libraryPath: path });
  },

  switchLanguage: async (language: "en" | "zh-CN") => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.LANGUAGE,
      language
    );
    set({ language });
  },

  switchNativeLanguage: async (lang: string) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.NATIVE_LANGUAGE,
      lang
    );
    set({ nativeLanguage: lang });
  },

  switchLearningLanguage: async (lang: string) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.LEARNING_LANGUAGE,
      lang
    );
    set({ learningLanguage: lang });
  },

  setProxy: async (config: ProxyConfigType) => {
    await window.__ENJOY_APP__.system.proxy.set(config);
    window.__ENJOY_APP__.system.proxy.refresh();
    set({ proxy: config });
  },

  setVocabularyConfig: async (config: VocabularyConfigType) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.VOCABULARY,
      config
    );
    set({ vocabularyConfig: config });
  },

  setRecorderConfig: async (config: RecorderConfigType) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.RECORDER,
      config
    );
    set({ recorderConfig: config });
  },

  setDisplayPreferences: (display: boolean) => {
    set({ displayPreferences: display });
  },

  setDisplayDepositDialog: (display: boolean) => {
    set({ displayDepositDialog: display });
  },

  // Actions - AI settings
  setSttEngine: async (name: SttEngineOptionEnum) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.STT_ENGINE,
      name
    );
    set({ sttEngine: name });
  },

  setGptEngine: async (engine: GptEngineSettingType) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.GPT_ENGINE,
      engine
    );
    set({ gptEngine: engine });
  },

  setOpenai: async (config: LlmProviderType) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.OPENAI,
      config
    );
    set({ openai: { ...config, name: "openai" } });
  },

  setTtsConfig: async (config: TtsConfigType) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.TTS_CONFIG,
      config
    );
    set({ ttsConfig: config });
  },

  setEchogardenSttConfig: async (config: EchogardenSttConfigType) => {
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.ECHOGARDEN,
      config
    );
    set({ echogardenSttConfig: config });
  },

  // Actions - Hotkeys
  setHotkey: async (key: string, value: string) => {
    const { hotkeys } = get();
    const updatedHotkeys = { ...hotkeys, [key]: value };
    await window.__ENJOY_APP__.config.setUserSetting(
      UserSettingKeyEnum.HOTKEYS,
      updatedHotkeys
    );
    set({ hotkeys: updatedHotkeys });
  },

  // Initialization
  initialize: async () => {
    const EnjoyApp = window.__ENJOY_APP__;

    // Fetch app settings
    const version = EnjoyApp.app.version;
    const apiUrl = await EnjoyApp.app.apiUrl();
    const libraryPath = await EnjoyApp.config.getLibrary();
    const proxy = await EnjoyApp.system.proxy.get();

    // Fetch user settings
    const language =
      (await EnjoyApp.config.getUserSetting(UserSettingKeyEnum.LANGUAGE)) ||
      "en";
    const nativeLanguage =
      (await EnjoyApp.config.getUserSetting(
        UserSettingKeyEnum.NATIVE_LANGUAGE
      )) || "zh-CN";
    const learningLanguage =
      (await EnjoyApp.config.getUserSetting(
        UserSettingKeyEnum.LEARNING_LANGUAGE
      )) || "en-US";
    const sttEngine =
      (await EnjoyApp.config.getUserSetting(UserSettingKeyEnum.STT_ENGINE)) ||
      SttEngineOptionEnum.ENJOY_AZURE;
    const openai = await EnjoyApp.config.getUserSetting(
      UserSettingKeyEnum.OPENAI
    );
    const gptEngine = (await EnjoyApp.config.getUserSetting(
      UserSettingKeyEnum.GPT_ENGINE
    )) || {
      name: "enjoyai",
      models: {
        default: "gpt-4o",
      },
    };
    const ttsConfig = await EnjoyApp.config.getUserSetting(
      UserSettingKeyEnum.TTS_CONFIG
    );
    const echogardenSttConfig = await EnjoyApp.config.getUserSetting(
      UserSettingKeyEnum.ECHOGARDEN
    );
    const vocabularyConfig = (await EnjoyApp.config.getUserSetting(
      UserSettingKeyEnum.VOCABULARY
    )) || { lookupOnMouseOver: true };
    const recorderConfig = (await EnjoyApp.config.getUserSetting(
      UserSettingKeyEnum.RECORDER
    )) || {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000,
      sampleSize: 16,
    };
    const hotkeys =
      (await EnjoyApp.config.getUserSetting(UserSettingKeyEnum.HOTKEYS)) || {};
    const user = await EnjoyApp.config.getUserSetting(
      UserSettingKeyEnum.PROFILE
    );

    // Fetch remote config
    let ipaMappings = {};
    let latestVersion = "";

    try {
      const webApi = new Client({
        baseUrl: apiUrl,
        accessToken: user?.accessToken,
      });

      ipaMappings = (await webApi.config("ipa_mappings")) || {};
      const versionInfo = (await webApi.config("app_version")) || {};
      latestVersion = versionInfo.version || "";
    } catch (error) {
      console.error("Failed to fetch remote config:", error);
    }

    // Update state
    set({
      apiUrl,
      user,
      initialized: Boolean(user && libraryPath),
      version,
      latestVersion,
      libraryPath,
      language: language as "en" | "zh-CN",
      nativeLanguage,
      learningLanguage,
      proxy,
      vocabularyConfig,
      recorderConfig,
      ipaMappings,
      sttEngine,
      openai: openai ? { ...openai, name: "openai" } : null,
      gptEngine,
      ttsConfig,
      echogardenSttConfig,
      hotkeys,
    });

    // Set up config change listener
    EnjoyApp.config.onChange((event: any, state: any) => {
      if (state.type === "appSettingsChanged") {
        switch (state.details.key) {
          case "apiUrl":
            set({ apiUrl: state.details.value });
            break;
          case "library":
            set({ libraryPath: state.details.value });
            break;
          case "proxy":
            set({ proxy: state.details.value });
            break;
        }
      } else if (state.type === "userSettingsLoaded") {
        set({
          user: state.details.profile,
          recorderConfig: state.details.recorder,
          vocabularyConfig: state.details.vocabulary,
          language: state.details.language,
          nativeLanguage: state.details.nativeLanguage,
          learningLanguage: state.details.learningLanguage,
        });
      } else if (state.type === "userSettingsUnloaded") {
        set({ user: null });
      }
    });
  },
}));
