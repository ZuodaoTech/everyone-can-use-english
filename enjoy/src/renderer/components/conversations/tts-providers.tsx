import { t } from "i18next";

export const TTS_PROVIDERS: { [key: string]: any } = {
  enjoyai: {
    name: "EnjoyAI",
    models: ["tts-1", "tts-1-hd"],
    voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
    configurable: ["voice"],
  },
  openai: {
    name: "OpenAI",
    description: t("youNeedToSetupApiKeyBeforeUsingOpenAI"),
    models: ["tts-1", "tts-1-hd"],
    voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
    configurable: ["model", "voice", "baseUrl"],
  },
};