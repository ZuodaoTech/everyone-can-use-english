import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import OpenAI, { toFile } from "openai";
import { useContext } from "react";
import { AI_WORKER_ENDPOINT } from "@/constants";
import { milisecondsToTimestamp } from "@renderer/lib/utils";
import axios from "axios";
import { t } from "i18next";

export const useSTT = () => {
  const { EnjoyApp, webApi, user } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);

  const transcribeByLocal = async (file: ArrayBuffer) => {
    const res = await EnjoyApp.whisper.transcribe(
      {
        blob: {
          type: "audio/wav",
          arrayBuffer: file,
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

  const transcribeByOpenAi = async (file: ArrayBuffer) => {
    if (!openai?.key) {
      throw new Error(t("openaiKeyRequired"));
    }

    const client = new OpenAI({
      apiKey: user.accessToken,
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
      file: await toFile(Buffer.from(file), "audio/wav"),
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

  const transcribeByCloudflareAi = async (file: ArrayBuffer) => {
    const res: CfWhipserOutputType = (
      await axios.postForm(
        `${AI_WORKER_ENDPOINT}/audio/transcriptions`,
        Buffer.from(file),
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      )
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

  const transcribeByAzureAi = async () => {
    const { token, region } = await webApi.generateSpeechToken();
  };

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

  return {
    transcribeByLocal,
    transcribeByOpenAi,
    transcribeByAzureAi,
    transcribeByCloudflareAi,
  };
};

const MAGIC_TOKENS = ["Mrs.", "Ms.", "Mr.", "Dr.", "Prof.", "St."];
const END_OF_WORD_REGEX = /[^\.!,\?][\.!\?]/g;
