export interface UserType {
  id: string;
  name?: string;
  email?: string;
  balance?: number;
  avatarUrl?: string;
  accessToken?: string;
  recordingsCount?: number;
  recordingsDuration?: number;
  hasMixin?: boolean;
  following?: boolean;
  createdAt?: string;
}

export interface ProxyConfigType {
  enabled: boolean;
  url: string;
}

export interface RecorderConfigType {
  autoGainControl: boolean;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  sampleRate: number;
  sampleSize: number;
}

export interface VocabularyConfigType {
  lookupOnMouseOver: boolean;
}

export interface GptEngineSettingType {
  name: string;
  models: {
    default: string;
    lookup?: string;
    translate?: string;
    analyze?: string;
    extractStory?: string;
  };
  baseUrl?: string;
  key?: string;
}

export interface LlmProviderType {
  name?: "enjoyai" | "openai";
  key?: string;
  model?: string;
  baseUrl?: string;
  models?: string;
}

export interface TtsConfigType {
  engine: string;
  model: string;
  language: string;
  voice: string;
  [key: string]: any;
}

export interface EchogardenSttConfigType {
  engine: "whisper" | "whisper.cpp";
  whisper: {
    model: string;
    temperature?: number;
    prompt?: string;
    encoderProvider?: "cpu" | "dml" | "cuda";
    decoderProvider?: "cpu" | "dml" | "cuda";
  };
  whisperCpp?: {
    model: string;
    temperature?: number;
    prompt?: string;
    enableGPU?: boolean;
  };
}
