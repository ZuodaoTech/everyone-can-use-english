import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import OpenAI from "openai";
import { useContext } from "react";
import { t } from "i18next";
import { AI_WORKER_ENDPOINT } from "@/constants";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from "axios";
import { AlignmentResult } from "echogarden/dist/api/API.d.js";
import { useAiCommand } from "./use-ai-command";

export const useTranscribe = () => {
  const { EnjoyApp, user, webApi, learningLanguage } = useContext(
    AppSettingsProviderContext
  );
  const { whisperConfig, openai } = useContext(AISettingsProviderContext);
  const { punctuateText } = useAiCommand();

  const transcode = async (src: string | Blob): Promise<string> => {
    if (src instanceof Blob) {
      src = await EnjoyApp.cacheObjects.writeFile(
        `${Date.now()}.${src.type.split("/")[1].split(";")[0]}`,
        await src.arrayBuffer()
      );
    }

    const output = await EnjoyApp.echogarden.transcode(src);
    return output;
  };

  const transcribe = async (
    mediaSrc: string,
    params?: {
      targetId?: string;
      targetType?: string;
      originalText?: string;
      language?: string;
    }
  ): Promise<{
    engine: string;
    model: string;
    alignmentResult: AlignmentResult;
    originalText?: string;
  }> => {
    const url = await transcode(mediaSrc);
    const {
      targetId,
      targetType,
      originalText,
      language = learningLanguage.split("-")[0],
    } = params || {};
    const blob = await (await fetch(url)).blob();

    let result;
    if (originalText) {
      result = {
        engine: "original",
        model: "original",
      };
    } else if (whisperConfig.service === "local") {
      result = await transcribeByLocal(url);
    } else if (whisperConfig.service === "cloudflare") {
      result = await transcribeByCloudflareAi(blob);
    } else if (whisperConfig.service === "openai") {
      result = await transcribeByOpenAi(blob);
    } else if (whisperConfig.service === "azure") {
      result = await transcribeByAzureAi(blob, { targetId, targetType });
    } else {
      throw new Error(t("whisperServiceNotSupported"));
    }

    let transcript = originalText || result.text;
    // if the transcript does not contain any punctuation, use AI command to add punctuation
    if (!transcript.match(/\w[.,!?](\s|$)/)) {
      try {
        transcript = await punctuateText(transcript);
      } catch (err) {
        console.warn(err.message);
      }
    }

    const alignmentResult = await EnjoyApp.echogarden.align(
      new Uint8Array(await blob.arrayBuffer()),
      transcript,
      {
        language,
      }
    );

    return {
      ...result,
      originalText,
      alignmentResult,
    };
  };

  const transcribeByLocal = async (url: string) => {
    const res = await EnjoyApp.whisper.transcribe(
      {
        file: url,
      },
      {
        force: true,
        extra: ["--prompt", `"Hello! Welcome to listen to this audio."`],
      }
    );

    return {
      engine: "whisper",
      model: res.model.type,
      text: res.transcription.map((segment) => segment.text).join(" "),
    };
  };

  const transcribeByOpenAi = async (blob: Blob) => {
    if (!openai?.key) {
      throw new Error(t("openaiKeyRequired"));
    }

    const client = new OpenAI({
      apiKey: openai.key,
      baseURL: openai.baseUrl,
      dangerouslyAllowBrowser: true,
    });

    const res: { text: string } = (await client.audio.transcriptions.create({
      file: new File([blob], "audio.wav"),
      model: "whisper-1",
      response_format: "json",
    })) as any;

    return {
      engine: "openai",
      model: "whisper-1",
      text: res.text,
    };
  };

  const transcribeByCloudflareAi = async (blob: Blob) => {
    const res: CfWhipserOutputType = (
      await axios.postForm(`${AI_WORKER_ENDPOINT}/audio/transcriptions`, blob, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        timeout: 1000 * 60 * 5,
      })
    ).data;

    return {
      engine: "cloudflare",
      model: "@cf/openai/whisper",
      text: res.text,
    };
  };

  const transcribeByAzureAi = async (
    blob: Blob,
    params?: {
      targetId?: string;
      targetType?: string;
    }
  ): Promise<{
    engine: string;
    model: string;
    text: string;
  }> => {
    const { token, region } = await webApi.generateSpeechToken(params);
    const config = sdk.SpeechConfig.fromAuthorizationToken(token, region);
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      new File([blob], "audio.wav")
    );
    // setting the recognition language to learning language, such as 'en-US'.
    config.speechRecognitionLanguage = learningLanguage;
    config.requestWordLevelTimestamps();
    config.outputFormat = sdk.OutputFormat.Detailed;

    // create the speech recognizer.
    const reco = new sdk.SpeechRecognizer(config, audioConfig);

    let results: SpeechRecognitionResultType[] = [];

    return new Promise((resolve, reject) => {
      reco.recognizing = (_s, e) => {
        console.log(e.result.text);
      };

      reco.recognized = (_s, e) => {
        const json = e.result.properties.getProperty(
          sdk.PropertyId.SpeechServiceResponse_JsonResult
        );
        const result = JSON.parse(json);
        results = results.concat(result);
      };

      reco.canceled = (_s, e) => {
        if (e.reason === sdk.CancellationReason.Error) {
          return reject(new Error(e.errorDetails));
        }

        reco.stopContinuousRecognitionAsync();
      };

      reco.sessionStopped = (_s, _e) => {
        reco.stopContinuousRecognitionAsync();

        resolve({
          engine: "azure",
          model: "whisper",
          text: results.map((result) => result.DisplayText).join(" "),
        });
      };

      reco.startContinuousRecognitionAsync();
    });
  };

  return {
    transcode,
    transcribe,
  };
};
