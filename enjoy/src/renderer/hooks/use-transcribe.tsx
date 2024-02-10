import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import OpenAI, { toFile } from "openai";
import { useContext } from "react";
import { milisecondsToTimestamp } from "@renderer/lib/utils";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { fetchFile } from "@ffmpeg/util";
import { AI_WORKER_ENDPOINT } from "@/constants";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from "axios";
import take from "lodash/take";
import sortedUniqBy from "lodash/sortedUniqBy";

export const useTranscribe = () => {
  const { EnjoyApp, ffmpeg, user, webApi } = useContext(
    AppSettingsProviderContext
  );
  const { whisperConfig, openai } = useContext(AISettingsProviderContext);

  const transcode = async (src: string, options?: string[]) => {
    if (!ffmpeg?.loaded) return;

    options = options || ["-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le"];

    try {
      const uri = new URL(src);
      const input = uri.pathname.split("/").pop();
      const output = input.replace(/\.[^/.]+$/, ".wav");
      await ffmpeg.writeFile(input, await fetchFile(src));
      await ffmpeg.exec(["-i", input, ...options, output]);
      const data = await ffmpeg.readFile(output);
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
      file: await toFile(blob),
      model: "whisper-1",
      response_format: "json",
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
      Buffer.from(await blob.arrayBuffer())
    );
    // setting the recognition language to English.
    config.speechRecognitionLanguage = "en-US";
    config.requestWordLevelTimestamps();
    config.outputFormat = sdk.OutputFormat.Detailed;

    // create the speech recognizer.
    const reco = new sdk.SpeechRecognizer(config, audioConfig);

    let results: SpeechRecognitionResultType[] = [];

    return new Promise((resolve, reject) => {
      reco.recognizing = (_s, e) => {};

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

const MAGIC_TOKENS = ["Mrs.", "Ms.", "Mr.", "Dr.", "Prof.", "St."];
const END_OF_WORD_REGEX = /[^\.!,\?][\.!\?]/g;
const groupTranscription = (
  transcription: TranscriptionResultSegmentType[]
): TranscriptionResultSegmentGroupType[] => {
  const generateGroup = (group?: TranscriptionResultSegmentType[]) => {
    if (!group || group.length === 0) return;

    const firstWord = group[0];
    const lastWord = group[group.length - 1];

    return {
      offsets: {
        from: firstWord.offsets.from,
        to: lastWord.offsets.to,
      },
      text: group.map((w) => w.text.trim()).join(" "),
      timestamps: {
        from: firstWord.timestamps.from,
        to: lastWord.timestamps.to,
      },
      segments: group,
    };
  };

  const groups: TranscriptionResultSegmentGroupType[] = [];
  let group: TranscriptionResultSegmentType[] = [];

  transcription.forEach((segment) => {
    const text = segment.text.trim();
    if (!text) return;

    group.push(segment);

    if (
      !MAGIC_TOKENS.includes(text) &&
      segment.text.trim().match(END_OF_WORD_REGEX)
    ) {
      // Group a complete sentence;
      groups.push(generateGroup(group));

      // init a new group
      group = [];
    }
  });

  // Group the last group
  const lastSentence = generateGroup(group);
  if (lastSentence) groups.push(lastSentence);

  return groups;
};
