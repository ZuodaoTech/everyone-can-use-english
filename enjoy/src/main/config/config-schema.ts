import { SttEngineOptionEnum } from "@shared/types/enums";
import {
  AppConfigType,
  ConfigSchema,
  UserConfigType,
} from "@shared/types/config.d";
import { LIBRARY_PATH_SUFFIX, WEB_API_URL } from "@shared/constants";
import path from "path";
import { app } from "electron";

export const DEFAULT_USER_SETTINGS: UserConfigType = {
  language: "zh-CN",
  nativeLanguage: "zh-CN",
  learningLanguage: "en-US",
  sttEngine: SttEngineOptionEnum.ENJOY_AZURE,
  whisper: "whisper-1",
  openai: {},
  gptEngine: {
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
  },
  recorder: {
    sampleRate: 44100,
    channels: 1,
    autoStop: true,
    autoStopTime: 2000,
  },
  hotkeys: {},
  profile: null,
};

// Default configurations
export const DEFAULT_APP_SETTINGS: AppConfigType = {
  library:
    process.env.LIBRARY_PATH ||
    path.join(app.getPath("documents"), LIBRARY_PATH_SUFFIX),
  apiUrl: WEB_API_URL,
  wsUrl: "",
  proxy: null,
  user: null,
  file: "",
};

// App settings schema
export const APP_SETTINGS_SCHEMA: ConfigSchema = {
  library: {
    type: "string",
    default: DEFAULT_APP_SETTINGS.library,
    description: "Path to the library directory",
  },
  apiUrl: {
    type: "string",
    default: DEFAULT_APP_SETTINGS.apiUrl,
    description: "API URL for the web service",
  },
  wsUrl: {
    type: "string",
    default: DEFAULT_APP_SETTINGS.wsUrl,
    description: "WebSocket URL for the web service",
  },
  proxy: {
    type: "object",
    default: DEFAULT_APP_SETTINGS.proxy,
    description: "Proxy configuration",
  },
  user: {
    type: "object",
    default: DEFAULT_APP_SETTINGS.user,
    description: "Current user information",
  },
  file: {
    type: "string",
    default: DEFAULT_APP_SETTINGS.file,
    description: "Current file path",
  },
};

// User settings schema
export const USER_SETTINGS_SCHEMA: ConfigSchema = {
  language: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.language,
    description: "UI language",
  },
  nativeLanguage: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.nativeLanguage,
    description: "Native language",
  },
  learningLanguage: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.learningLanguage,
    description: "Learning language",
  },
  sttEngine: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.sttEngine,
    description: "Speech-to-text engine",
  },
  whisper: {
    type: "string",
    default: DEFAULT_USER_SETTINGS.whisper,
    description: "Whisper model",
  },
  openai: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.openai,
    description: "OpenAI configuration",
  },
  gptEngine: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.gptEngine,
    description: "GPT engine configuration",
  },
  recorder: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.recorder,
    description: "Recorder configuration",
  },
  hotkeys: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.hotkeys,
    description: "Hotkey configuration",
  },
  profile: {
    type: "object",
    default: DEFAULT_USER_SETTINGS.profile,
    description: "User profile",
  },
};
