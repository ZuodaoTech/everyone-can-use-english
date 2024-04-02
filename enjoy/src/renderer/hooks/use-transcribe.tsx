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
import take from "lodash/take";
import sortedUniqBy from "lodash/sortedUniqBy";
import { groupTranscription, milisecondsToTimestamp } from "@/utils";
import { END_OF_SENTENCE_REGEX } from "@/constants";
import { AlignmentResult } from "echogarden/dist/api/API.d.js";

export const useTranscribe = () => {
  const { EnjoyApp, user, webApi } = useContext(AppSettingsProviderContext);
  const { whisperConfig, openai } = useContext(AISettingsProviderContext);

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
    }
  ): Promise<{
    engine: string;
    model: string;
    alignmentResult: AlignmentResult;
    originalText?: string;
  }> => {
    const url = await transcode(mediaSrc);
    const { targetId, targetType, originalText } = params || {};
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

    const alignmentResult = await EnjoyApp.echogarden.align(
      new Uint8Array(await blob.arrayBuffer()),
      originalText || result.result.map((segment) => segment.text).join(" ")
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

    const result = groupTranscription(res.transcription);

    return {
      engine: "whisper",
      model: res.model.type,
      result,
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

    const res: {
      words: {
        word: string;
        start: number;
        end: number;
      }[];
    } = (await client.audio.transcriptions.create({
      file: new File([blob], "audio.wav"),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    })) as any;

    const transcription: TranscriptionResultSegmentType[] = res.words.map(
      (word) => {
        return {
          offsets: {
            from: word.start * 1000,
            to: word.end * 1000,
          },
          timestamps: {
            from: milisecondsToTimestamp(word.start * 1000),
            to: milisecondsToTimestamp(word.end * 1000),
          },
          text: word.word,
        };
      }
    );

    const result = groupTranscription(transcription);

    return {
      engine: "openai",
      model: "whisper-1",
      result,
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
    const transcription: TranscriptionResultSegmentType[] = res.words.map(
      (word) => {
        return {
          offsets: {
            from: word.start * 1000,
            to: word.end * 1000,
          },
          timestamps: {
            from: milisecondsToTimestamp(word.start * 1000),
            to: milisecondsToTimestamp(word.end * 1000),
          },
          text: word.word,
        };
      }
    );

    const result = groupTranscription(transcription);

    return {
      engine: "cloudflare",
      model: "@cf/openai/whisper",
      result,
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
    result: TranscriptionResultSegmentGroupType[];
  }> => {
    const { token, region } = await webApi.generateSpeechToken(params);
    const config = sdk.SpeechConfig.fromAuthorizationToken(token, region);
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      new File([blob], "audio.wav")
    );
    // setting the recognition language to English.
    config.speechRecognitionLanguage = "en-US";
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

        const transcription: TranscriptionResultSegmentType[] = [];

        results.forEach((result) => {
          const best = take(sortedUniqBy(result.NBest, "Confidence"), 1)[0];
          const words = best.Display.trim().split(" ");

          best.Words.map((word, index) => {
            let text = word.Word;
            if (words.length === best.Words.length) {
              text = words[index];
            }

            if (
              index === best.Words.length - 1 &&
              !text.trim().match(END_OF_SENTENCE_REGEX)
            ) {
              text = text + ".";
            }

            transcription.push({
              offsets: {
                from: word.Offset / 1e4,
                to: (word.Offset + word.Duration) / 1e4,
              },
              timestamps: {
                from: milisecondsToTimestamp(word.Offset / 1e4),
                to: milisecondsToTimestamp((word.Offset + word.Duration) * 1e4),
              },
              text,
            });
          });
        });

        resolve({
          engine: "azure",
          model: "whisper",
          result: groupTranscription(transcription),
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
