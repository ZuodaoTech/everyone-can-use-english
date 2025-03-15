import { SttEngineOptionEnum } from "@shared/types/enums";

// App-level configuration (stored in electron-settings)
export interface AppSettings {
  library: string;
  apiUrl: string;
  wsUrl: string;
  proxy: ProxyConfigType;
  user: {
    id: string;
    name?: string;
  } | null;
  file: string;
}

// User-level configuration (stored in database)
export interface UserSettings {
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
export interface Config extends AppSettings {
  user: (AppSettings["user"] & UserSettings) | null;
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

// New types for the refactored config system

// Storage provider interface
export interface ConfigStorageProvider {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
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

// Config store options
export interface ConfigStoreOptions {
  name: string;
  schema?: ConfigSchema;
  storage?: ConfigStorageProvider;
}

// Config store events
export enum ConfigStoreEvent {
  CHANGE = "change",
  ERROR = "error",
}

// Config store listener
export type ConfigStoreListener = (key: string, value: any) => void;
