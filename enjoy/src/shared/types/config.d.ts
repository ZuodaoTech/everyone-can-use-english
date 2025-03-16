import { SttEngineOptionEnum } from "@shared/types/enums";

// App-level configuration (stored in electron-settings)
export interface AppConfigType {
  library: string;
  apiUrl: string;
  wsUrl: string;
  proxy: ProxyConfigType;
  user: {
    id: string;
    name?: string;
    avatar_url?: string;
  } | null;
  file: string;
}

// User-level configuration (stored in database)
export interface UserConfigType {
  language: string;
  nativeLanguage: string;
  learningLanguage: string;
  sttEngine: SttEngineOptionEnum;
  whisper: string;
  openai: {
    apiKey?: string;
    organization?: string;
  };
  gptEngine: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  recorder: {
    sampleRate: number;
    channels: number;
    autoStop: boolean;
    autoStopTime: number;
  };
  hotkeys: Record<string, string>;
  profile: UserType | null;
}

// Combined configuration
export interface ConfigType extends AppConfigType {
  user: (AppConfigType["user"] & UserConfigType) | null;
  plugins?: PluginSettings;
  paths: {
    userData: string | null;
    library: string;
    cache: string;
    db: string | null;
  };
}

// Configuration source
export enum ConfigSource {
  DEFAULT = "default",
  FILE = "file",
  DATABASE = "database",
  ENV = "environment",
}

// Configuration value with metadata
export interface ConfigValue<T> {
  value: T;
  source: ConfigSource;
  timestamp: number;
}

// Config schema definition
export interface ConfigSchema {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object" | "array";
    default: any;
    validate?: (value: any) => boolean;
    description?: string;
  };
}

// Add this new enum for config events
export enum ConfigEvent {
  USER_LOGIN = "userLogin",
  USER_LOGOUT = "userLogout",
  USER_SETTINGS_LOADED = "userSettingsLoaded",
  USER_SETTINGS_UNLOADED = "userSettingsUnloaded",
  APP_SETTINGS_CHANGED = "appSettingsChanged",
  USER_SETTINGS_CHANGED = "userSettingsChanged",
}
