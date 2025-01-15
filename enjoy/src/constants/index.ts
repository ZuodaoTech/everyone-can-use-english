export * from "./chat-agent-templates";
export * from "./gpt-presets";
export * from "./ipa";

export const WHISPER_MODELS = [
  "tiny",
  "tiny.en",
  "base",
  "base.en",
  "small",
  "small.en",
  "medium",
  "medium.en",
  "large-v1",
  "large-v2",
  "large-v3",
  "large-v3-turbo",
];

import languages from "./languages.json";
export const LANGUAGES = languages;

export const DATABASE_NAME = "enjoy_database";
export const LIBRARY_PATH_SUFFIX = "EnjoyLibrary";

export const STORAGE_WORKER_ENDPOINT = "https://storage.enjoy.bot";
export const STORAGE_WORKER_ENDPOINTS = [
  "https://storage.enjoy.bot",
  "https://enjoy-storage.baizhiheizi.com",
];

export const AI_WORKER_ENDPOINT = "https://ai-worker.enjoy.bot";

export const WEB_API_URL = "https://enjoy.bot";
export const WS_URL = "wss://enjoy.bot";

export const DOWNLOAD_URL = "https://1000h.org/enjoy-app/install.html";

export const REPO_URL =
  "https://github.com/zuodaotech/everyone-can-use-english";

export const MAGIC_TOKEN_REGEX =
  /\b(Mrs|Ms|Mr|Dr|Prof|St|[a-zA-Z]{1,2}|\d{1,2})\.\b/g;
export const END_OF_SENTENCE_REGEX = /[^\.!,\?][\.!\?]/g;

export const FFMPEG_TRIM_SILENCE_OPTIONS = [
  "-af",
  "silenceremove=1:start_duration=1:start_threshold=-50dB:detection=peak,aformat=dblp,areverse,silenceremove=start_periods=1:start_duration=1:start_threshold=-50dB:detection=peak,aformat=dblp,areverse",
];

export const FFMPEG_CONVERT_WAV_OPTIONS = [
  "-ar",
  "16000",
  "-ac",
  "1",
  "-c:a",
  "pcm_s16le",
];

export const AudioFormats = ["mp3", "wav", "ogg", "flac", "m4a", "wma", "aac"];

export const VideoFormats = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"];

export const DocumentFormats = ["epub", "md", "markdown", "html", "txt"];

export const PROCESS_TIMEOUT = 1000 * 60 * 15;

export const NOT_SUPPORT_JSON_FORMAT_MODELS = [
  "gpt-4-vision-preview",
  "gpt-4",
  "gpt-4-32k",
];

export const CHAT_GROUP_PROMPT_TEMPLATE = `You are {name} in this chat. You should reply to everyone in this chat and always stay in character.

[Recent Chat History]
{history}`;

export const DEFAULT_GPT_CONFIG = {
  model: "gpt-4o",
  engine: "enjoyai",
  temperature: 0.8,
  historyBufferSize: 10,
  maxCompletionTokens: -1,
  presencePenalty: 0,
  frequencyPenalty: 0,
  numberOfChoices: 1,
};

export const AGENT_FIXTURE_AVA = {
  name: "Ava",
  description: "I'm Ava, your English speaking teacher.",
  language: "en-US",
  config: {
    engine: "enjoyai",
    model: "gpt-4o",
    prompt:
      "You are an experienced English teacher who excels at improving students' speaking skills. You always use simple yet authentic words and sentences to help students understand.",
    temperature: 1,
    ttsEngine: "enjoyai",
    ttsModel: "azure/speech",
    ttsVoice: "en-US-AvaNeural",
  },
};

export const AGENT_FIXTURE_ANDREW = {
  name: "Andrew",
  description: "I'm Andrew, your American friend.",
  language: "en-US",
  config: {
    engine: "enjoyai",
    model: "gpt-4o",
    prompt:
      "You're a native American who speaks authentic American English, familiar with the culture and customs of the U.S. You're warm and welcoming, eager to make friends from abroad and share all aspects of American life.",
    temperature: 0.9,
    ttsEngine: "enjoyai",
    ttsModel: "azure/speech",
    ttsVoice: "en-US-AndrewNeural",
  },
};

export const BUGSNAG_API_KEY = "828ee1de10c079a250be7fd05177662f";

export const MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".wma": "audio/x-ms-wma",
};
