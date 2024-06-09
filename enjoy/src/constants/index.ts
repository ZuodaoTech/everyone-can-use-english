export * from './gpt-presets';
export * from './ipa';

// https://hf-mirror.com/ggerganov/whisper.cpp/tree/main
import whisperModels from './whisper-models.json';
export const WHISPER_MODELS_OPTIONS = whisperModels;

import languages from './languages.json';
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

export const REPO_URL = "https://github.com/xiaolai/everyone-can-use-english";

export const SENTRY_DSN =
  "https://d51056d7af7d14eae446c0c15b4f3d31@o1168905.ingest.us.sentry.io/4506969353289728";

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

export const PROCESS_TIMEOUT = 1000 * 60 * 15;

export const NOT_SUPPORT_JSON_FORMAT_MODELS = [
  "gpt-4-vision-preview",
  "gpt-4",
  "gpt-4-32k",
];