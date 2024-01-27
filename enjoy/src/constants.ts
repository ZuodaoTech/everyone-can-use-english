export const DATABASE_NAME = "enjoy_database";
export const LIBRARY_PATH_SUFFIX = "EnjoyLibrary";

export const STORAGE_WORKER_ENDPOINT = "https://enjoy-storage.baizhiheizi.com";
export const AI_WORKER_ENDPOINT = "https://enjoy-ai.baizhiheizi.com";
export const WEB_API_URL = "https://enjoy-web.fly.dev";

export const REPO_URL = "https://github.com/xiaolai/everyone-can-use-english";

// https://huggingface.co/ggerganov/whisper.cpp/tree/main
export const WHISPER_MODELS_OPTIONS = [
  {
    type: "tiny",
    name: "ggml-tiny.en.bin",
    size: "77.7 MB",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
  },
  {
    type: "base",
    name: "ggml-base.en.bin",
    size: "148 MB",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin",
  },
  {
    type: "small",
    name: "ggml-small.en.bin",
    size: "488 MB",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin",
  },
  {
    type: "medium",
    name: "ggml-medium.en.bin",
    size: "1.53 GB",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin",
  },
  {
    type: "large",
    name: "ggml-large-v3.bin",
    size: "3.09 GB",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
  },
];

export const AudioFormats = ["mp3", "wav", "ogg", "flac", "m4a", "wma", "aac"];

export const VideoFormats = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"];

export const PROCESS_TIMEOUT = 1000 * 60 * 15;

export const AI_GATEWAY_ENDPOINT =
  "https://gateway.ai.cloudflare.com/v1/11d43ab275eb7e1b271ba4089ecc3864/enjoy";
