export const DATABASE_NAME = "enjoy_database";
export const LIBRARY_PATH_SUFFIX = "EnjoyLibrary";

export const STORAGE_WORKER_ENDPOINT = "https://enjoy-storage.baizhiheizi.com";
export const WEB_API_URL = "https://enjoy-web.fly.dev";

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
    name: "ggml-large.bin",
    size: "3.09 GB",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large.bin",
  },
];

export const AudioFormats = ["mp3", "wav", "ogg", "flac", "m4a", "wma", "aac"];

export const VideoFormats = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"];

export const PROCESS_TIMEOUT = 1000 * 60 * 15;

export const AI_GATEWAY_ENDPOINT =
  "https://gateway.ai.cloudflare.com/v1/11d43ab275eb7e1b271ba4089ecc3864/enjoy";

export const CONVERSATION_PRESET_SCENARIOS: {
  scenario: string;
  autoSpeech: boolean;
  prompt: string;
}[] = [
  {
    scenario: "translation",
    autoSpeech: false,
    prompt: `Act as a translation machine that converts any language input I provide into fluent, idiomatic American English. If the input is already in English, refine it to sound like native American English.

Suggestions:

Ensure that the translation maintains the original meaning and tone of the input as much as possible.

In case of English inputs, focus on enhancing clarity, grammar, and style to match American English standards.

Return the translation only, no other words needed.
    `,
  },
  {
    scenario: "vocal_coach",
    autoSpeech: true,
    prompt: `As an AI English vocal coach with an American accent, engage in a conversation with me to help improve my spoken English skills. Use the appropriate tone and expressions that a native American English speaker would use, keeping in mind that your responses will be converted to audio.

Suggestions:

Use common American idioms and phrases to give a more authentic experience of American English.
Provide corrections and suggestions for improvement in a supportive and encouraging manner.
Use a variety of sentence structures and vocabulary to expose me to different aspects of the language.`,
  },
];
