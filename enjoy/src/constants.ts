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
    size: "75 MB",
    sha: "c78c86eb1a8faa21b369bcd33207cc90d64ae9df",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
  },
  {
    type: "base",
    name: "ggml-base.en.bin",
    size: "142 MB",
    sha: "137c40403d78fd54d454da0f9bd998f78703390c",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin",
  },
  {
    type: "small",
    name: "ggml-small.en.bin",
    size: "466 MB",
    sha: "db8a495a91d927739e50b3fc1cc4c6b8f6c2d022",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin",
  },
  {
    type: "medium",
    name: "ggml-medium.en.bin",
    size: "1.5 GB",
    sha: "8c30f0e44ce9560643ebd10bbe50cd20eafd3723",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin",
  },
  {
    type: "large",
    name: "ggml-large-v3.bin",
    size: "2.9 GB",
    sha: "ad82bf6a9043ceed055076d0fd39f5f186ff8062",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
  },
];

export const AudioFormats = ["mp3", "wav", "ogg", "flac", "m4a", "wma", "aac"];

export const VideoFormats = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"];

export const PROCESS_TIMEOUT = 1000 * 60 * 15;

export const AI_GATEWAY_ENDPOINT =
  "https://gateway.ai.cloudflare.com/v1/11d43ab275eb7e1b271ba4089ecc3864/enjoy";
