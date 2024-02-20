import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import OpenAI from "openai";
import { useContext } from "react";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { fetchFile } from "@ffmpeg/util";
import { AI_WORKER_ENDPOINT } from "@/constants";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from "axios";
import take from "lodash/take";
import sortedUniqBy from "lodash/sortedUniqBy";
import {
  groupTranscription,
  END_OF_WORD_REGEX,
  milisecondsToTimestamp,
} from "@/utils";

export const useTranscribe = () => {
  const { EnjoyApp, ffmpegWasm, ffmpegValid, user, webApi } = useContext(
    AppSettingsProviderContext
  );
  const { whisperConfig, openai } = useContext(AISettingsProviderContext);

  const transcode = async (src: string | Blob, options?: string[]) => {
    if (ffmpegValid) {
      if (src instanceof Blob) {
        src = await EnjoyApp.cacheObjects.writeFile(
          `${Date.now()}.${src.type.split("/")[1]}`,
          await src.arrayBuffer()
        );
      }

      const output = `enjoy://library/cache/${src.split("/").pop()}.wav`;
      await EnjoyApp.ffmpeg.transcode(src, output, options);
      const data = await fetchFile(output);
      return new Blob([data], { type: "audio/wav" });
    } else {
      return transcodeUsingWasm(src, options);
    }
  };

  const transcodeUsingWasm = async (src: string | Blob, options?: string[]) => {
    if (!ffmpegWasm?.loaded) return;

    options = options || ["-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le"];

    try {
      let uri: URL;
      if (src instanceof Blob) {
        uri = new URL(URL.createObjectURL(src));
      } else {
        uri = new URL(src);
      }

      const input = uri.pathname.split("/").pop();
      let output: string;
      if (src instanceof Blob) {
        output = input + ".wav";
      } else {
        output = input.replace(/\.[^/.]+$/, ".wav");
      }
      await ffmpegWasm.writeFile(input, await fetchFile(src));
      await ffmpegWasm.exec(["-i", input, ...options, output]);
      const data = await ffmpegWasm.readFile(output);
      return new Blob([data], { type: "audio/wav" });
    } catch (e) {
      toast.error(t("transcodeError"));
    }
  };

  const transcribe = async (
    mediaSrc: string
  ): Promise<{
    engine: string;
    model: string;
    result: TranscriptionResultSegmentGroupType[];
  }> => {
    const blob = await transcode(mediaSrc);

    if (whisperConfig.service === "local") {
      return transcribeByLocal(blob);
    } else if (whisperConfig.service === "cloudflare") {
      return transcribeByCloudflareAi(blob);
    } else if (whisperConfig.service === "openai") {
      return transcribeByOpenAi(blob);
    } else if (whisperConfig.service === "azure") {
      return transcribeByAzureAi(blob);
    } else {
      throw new Error(t("whisperServiceNotSupported"));
    }
  };

  const transcribeByLocal = async (blob: Blob) => {
    const res = await EnjoyApp.whisper.transcribe(
      {
        blob: {
          type: blob.type.split(";")[0],
          arrayBuffer: await blob.arrayBuffer(),
        },
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
    blob: Blob
  ): Promise<{
    engine: string;
    model: string;
    result: TranscriptionResultSegmentGroupType[];
  }> => {
    const { token, region } = await webApi.generateSpeechToken();
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
              !text.trim().match(END_OF_WORD_REGEX)
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
