import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useContext } from "react";
import OpenAI from "openai";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { t } from "i18next";

export const useSpeech = () => {
  const { EnjoyApp, webApi, user, apiUrl, learningLanguage } = useContext(
    AppSettingsProviderContext
  );
  const { openai, ttsConfig } = useContext(AISettingsProviderContext);

  const tts = async (params: Partial<SpeechType>) => {
    const { configuration } = params;
    const { engine, model, voice } = configuration || ttsConfig;

    let buffer;
    if (model.match(/^(openai|tts-)/)) {
      buffer = await openaiTTS(params);
    } else if (model.startsWith("azure")) {
      buffer = await azureTTS(params);
    }

    return EnjoyApp.speeches.create(
      {
        text: params.text,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        section: params.section,
        segment: params.segment,
        configuration: {
          engine,
          model,
          voice,
        },
      },
      {
        type: "audio/mp3",
        arrayBuffer: buffer,
      }
    );
  };

  const openaiTTS = async (params: Partial<SpeechType>) => {
    const { configuration } = params;
    const {
      engine = ttsConfig.engine,
      model = ttsConfig.model,
      voice = ttsConfig.voice,
      baseUrl,
    } = configuration || {};

    let client: OpenAI;

    if (engine === "enjoyai") {
      client = new OpenAI({
        apiKey: user.accessToken,
        baseURL: `${apiUrl}/api/ai`,
        dangerouslyAllowBrowser: true,
        maxRetries: 1,
      });
    } else if (openai) {
      client = new OpenAI({
        apiKey: openai.key,
        baseURL: baseUrl || openai.baseUrl,
        dangerouslyAllowBrowser: true,
        maxRetries: 1,
      });
    } else {
      throw new Error(t("openaiKeyRequired"));
    }

    const file = await client.audio.speech.create({
      input: params.text,
      model: model.replace("openai/", ""),
      voice,
    });

    return file.arrayBuffer();
  };

  const azureTTS = async (
    params: Partial<SpeechType>
  ): Promise<ArrayBuffer> => {
    const { configuration = ttsConfig, text } = params;
    const { model, voice } = configuration;

    if (model !== "azure/speech") return;

    const customKey = await EnjoyApp.appSettings.getAzureSpeechKey();
    const customEndpoint = await EnjoyApp.appSettings.getAzureSpeechEndpoint();
    const customRegion = await EnjoyApp.appSettings.getAzureSpeechRegion();

    let tokenId: number;
    let speechConfig: sdk.SpeechConfig;

    if (customKey && customRegion) {
      // Use user's own subscription
      if (customEndpoint) {
        speechConfig = sdk.SpeechConfig.fromEndpoint(new URL(customEndpoint), customKey);
      } else {
        speechConfig = sdk.SpeechConfig.fromSubscription(customKey, customRegion);
      }
    } else {
      // Use default service token
      const { id, token, region } = await webApi.generateSpeechToken({
        purpose: "tts",
        input: text,
      });
      tokenId = id;
      
      if (customEndpoint) {
        speechConfig = sdk.SpeechConfig.fromEndpoint(new URL(customEndpoint), token);
      } else {
        speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, customRegion || region);
      }
    }
    
    speechConfig.speechRecognitionLanguage = learningLanguage;
    speechConfig.speechSynthesisVoiceName = voice;

    // const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, sdk.AudioConfig.fromDefaultSpeakerOutput());
    // Do not playback audio when transcribed
    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

    return new Promise((resolve, reject) => {
      speechSynthesizer.speakTextAsync(
        text,
        (result) => {
          speechSynthesizer.close();

          if (result && result.audioData) {
            if (tokenId) webApi.consumeSpeechToken(tokenId);
            resolve(result.audioData);
          } else {
            if (tokenId) webApi.revokeSpeechToken(tokenId);
            reject(result);
          }
        },
        (error) => {
          speechSynthesizer.close();
          if (tokenId) webApi.revokeSpeechToken(tokenId);
          reject(error);
        }
      );
    });
  };

  return {
    tts,
  };
};
