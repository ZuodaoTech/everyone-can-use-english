export enum UserSettingKeyEnum {
  PROFILE = "profile",
  LANGUAGE = "language",
  NATIVE_LANGUAGE = "native_language",
  LEARNING_LANGUAGE = "learning_language",
  WHISPER = "whisper",
  OPENAI = "openai",
  HOTKEYS = "hotkeys",
  GPT_ENGINE = "gpt_engine",
  STT_ENGINE = "stt_engine",
  TTS_CONFIG = "tts_config",
  VOCABULARY = "vocabulary",
  DICTS = "dicts",
  RECORDER = "recorder",
  ECHOGARDEN = "echogarden",
  PLUGIN = "plugin",
}

export enum SttEngineOptionEnum {
  LOCAL = "local",
  ENJOY_AZURE = "enjoy_azure",
  ENJOY_CLOUDFLARE = "enjoy_cloudflare",
  OPENAI = "openai",
}

export enum AppSettingsKeyEnum {
  LIBRARY = "library",
  USER = "user",
  API_URL = "api_url",
}

export enum ChatTypeEnum {
  CONVERSATION = "CONVERSATION",
  GROUP = "GROUP",
  TTS = "TTS",
}

export enum ChatAgentTypeEnum {
  GPT = "GPT",
  TTS = "TTS",
}

export enum ChatMessageRoleEnum {
  USER = "USER",
  AGENT = "AGENT",
  SYSTEM = "SYSTEM",
}

export enum ChatMessageCategoryEnum {
  DEFAULT = "DEFAULT",
  MEMBER_JOINED = "MEMBER_JOINED",
  MEMBER_LEFT = "MEMBER_LEFT",
  CONTEXT_BREAK = "CONTEXT_BREAK",
}

export enum ChatMessageStateEnum {
  PENDING = "pending",
  COMPLETED = "completed",
}
