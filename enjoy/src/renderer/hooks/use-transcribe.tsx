import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import OpenAI from "openai";
import { useContext, useState } from "react";
import { t } from "i18next";
import { AI_WORKER_ENDPOINT } from "@/constants";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from "axios";
import { useAiCommand } from "./use-ai-command";
import { toast } from "@renderer/components/ui";
import {
  Timeline,
  TimelineEntry,
  type TimelineEntryType,
} from "echogarden/dist/utilities/Timeline";
import { parseText } from "media-captions";
import { SttEngineOptionEnum } from "@/types/enums";
import { RecognitionResult } from "echogarden/dist/api/API.js";

// test a text string has any punctuations or not
// some transcribed text may not have any punctuations
const punctuationsPattern = /\w[.,!?](\s|$)/g;

export const useTranscribe = () => {
  const { EnjoyApp, user, webApi } = useContext(AppSettingsProviderContext);
  const { openai, whisperConfig } = useContext(AISettingsProviderContext);
  const { punctuateText } = useAiCommand();
  const [output, setOutput] = useState<string>("");

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
    mediaSrc: string | Blob,
    params?: {
      targetId?: string;
      targetType?: string;
      originalText?: string;
      language: string;
      service: SttEngineOptionEnum | "upload";
      isolate?: boolean;
      align?: boolean;
    }
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    timeline: TimelineEntry[];
    originalText?: string;
    tokenId?: number;
    url: string;
  }> => {
    const url = await transcode(mediaSrc);
    const {
      targetId,
      targetType,
      originalText,
      language,
      service,
      isolate = false,
      align = true,
    } = params || {};
    const blob = await (await fetch(url)).blob();

    let result: any;
    if (service === "upload" && originalText) {
      result = await alignText(blob, { originalText, language, isolate });
    } else if (service === SttEngineOptionEnum.LOCAL) {
      result = await transcribeByLocal(url, language);
    } else if (service === SttEngineOptionEnum.ENJOY_CLOUDFLARE) {
      result = await transcribeByCloudflareAi(blob, { language, isolate });
    } else if (service === SttEngineOptionEnum.OPENAI) {
      result = await transcribeByOpenAi(
        new File([blob], "audio.mp3", { type: "audio/mp3" }),
        { language, isolate }
      );
    } else {
      // Azure AI is the default service
      result = await transcribeByAzureAi(
        new File([blob], "audio.wav", { type: "audio/wav" }),
        language,
        {
          targetId,
          targetType,
        }
      );
    }

    return {
      ...result,
      url,
    };
  };

  const alignText = async (
    blob: Blob,
    options: { originalText: string; language: string; isolate?: boolean }
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    timeline: TimelineEntry[];
  }> => {
    const { originalText, language, isolate = false } = options;
    let timeline: Timeline = [];
    const caption = await parseText(originalText, { type: "srt" });

    if (caption.cues.length > 0) {
      // valid srt file
      timeline = caption.cues.map((cue) => {
        return {
          type: "sentence",
          text: cue.text,
          startTime: cue.startTime,
          endTime: cue.endTime,
          timeline: [],
        };
      });

      const wordTimeline = await EnjoyApp.echogarden.alignSegments(
        new Uint8Array(await blob.arrayBuffer()),
        timeline,
        {
          language: language.split("-")[0],
          isolate,
        }
      );

      timeline = await EnjoyApp.echogarden.wordToSentenceTimeline(
        wordTimeline,
        caption.cues.map((cue) => cue.text).join(" "),
        language.split("-")[0]
      );

      return {
        engine: "upload",
        model: "-",
        transcript: timeline.map((entry) => entry.text).join(" "),
        timeline,
      };
    } else {
      // Remove all content inside `()`, `[]`, `{}` and trim the text
      // remove all markdown formatting
      let transcript = originalText
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/\{.*?\}/g, "")
        .replace(/[*_`]/g, "")
        .trim();

      // if the transcript does not contain any punctuation, use AI command to add punctuation
      if (!transcript.match(punctuationsPattern)) {
        try {
          transcript = await punctuateText(transcript);
        } catch (err) {
          toast.error(err.message);
          console.warn(err);
        }
      }

      setOutput("Aligning the transcript...");
      const alignmentResult = await EnjoyApp.echogarden.align(
        new Uint8Array(await blob.arrayBuffer()),
        transcript,
        {
          language: language.split("-")[0],
          isolate,
        }
      );

      alignmentResult.timeline.forEach((t: TimelineEntry) => {
        if (t.type === "sentence") {
          timeline.push(t);
        } else {
          t.timeline.forEach((st) => {
            timeline.push(st);
          });
        }
      });
      return {
        engine: "upload",
        model: "-",
        transcript,
        timeline,
      };
    }
  };

  const transcribeByLocal = async (
    url: string,
    language?: string
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    timeline: TimelineEntry[];
  }> => {
    const languageCode = language.split("-")[0];
    const res: RecognitionResult = await EnjoyApp.echogarden.recognize(url, {
      engine: "whisper",
      language: languageCode,
      whisper: {
        model: languageCode === "en" ? "tiny.en" : "tiny",
      },
    });

    if (!res) {
      throw new Error(t("whisperTranscribeFailed", { error: "" }));
    }

    const timeline: TimelineEntry[] = res.timeline
      .map((segment) => {
        // ignore the word if it is empty or in the format of `[xxx]` or `(xxx)`
        if (
          !segment.text.trim() ||
          segment.text.trim().match(/^[\[\(].+[\]\)]$/)
        ) {
          return null;
        }

        return {
          type: segment.type,
          text: segment.text.trim(),
          startTime: segment.startTime,
          endTime: segment.endTime,
          timeline: [],
        };
      })
      .filter((s) => Boolean(s?.text));

    const transcript = timeline
      .map((segment) => segment.text)
      .join(" ")
      .trim();

    return {
      engine: "whisper",
      model: whisperConfig.model,
      transcript,
      timeline,
    };
  };

  const transcribeByOpenAi = async (
    file: File,
    options: { language: string; isolate: boolean }
  ) => {
    const { language, isolate } = options;
    const languageCode = language.split("-")[0];
    if (!openai?.key) {
      throw new Error(t("openaiKeyRequired"));
    }

    const client = new OpenAI({
      apiKey: openai.key,
      baseURL: openai.baseUrl,
      dangerouslyAllowBrowser: true,
      maxRetries: 0,
    });

    setOutput("Transcribing from OpenAI...");
    const res: {
      text: string;
      words?: { word: string; start: number; end: number }[];
      segments?: { text: string; start: number; end: number }[];
    } = (await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })) as any;

    setOutput("Aligning the transcript...");
    let timeline: TimelineEntry[] = [];
    if (res.words) {
      res.words.forEach((word) => {
        const wordTimeline = {
          type: "word" as TimelineEntryType,
          text: word.word,
          startTime: word.start,
          endTime: word.end,
        };
        timeline.push(wordTimeline);
      });
    } else if (res.segments) {
      const segmentTimeline = res.segments.map((segment) => {
        return {
          type: "segment" as TimelineEntryType,
          text: segment.text,
          startTime: segment.start,
          endTime: segment.end,
          timeline: [] as TimelineEntry[],
        };
      });
      timeline = await EnjoyApp.echogarden.alignSegments(
        new Uint8Array(await file.arrayBuffer()),
        segmentTimeline,
        {
          language: languageCode,
          isolate,
        }
      );
    }

    timeline = await EnjoyApp.echogarden.wordToSentenceTimeline(
      timeline,
      res.text,
      languageCode
    );

    return {
      engine: "openai",
      model: "whisper-1",
      transcript: res.text,
      timeline,
    };
  };

  const transcribeByCloudflareAi = async (
    blob: Blob,
    options: { language: string; isolate: boolean }
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    timeline?: TimelineEntry[];
  }> => {
    const { language, isolate } = options;
    const languageCode = language.split("-")[0];
    setOutput("Transcribing from Cloudflare...");
    const res: CfWhipserOutputType = (
      await axios.postForm(`${AI_WORKER_ENDPOINT}/audio/transcriptions`, blob, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        timeout: 1000 * 60 * 5,
      })
    ).data;

    setOutput("Aligning the transcript...");
    // Get word timeline from the result
    let wordTimeline: Timeline = [];
    if (res.words && res.words.length > 0) {
      wordTimeline = res.words.map((word) => {
        return {
          type: "word",
          text: word.word,
          startTime: word.start,
          endTime: word.end,
        };
      });
    } else {
      const caption = await parseText(res.vtt, { type: "vtt" });
      const segmentTimeline: TimelineEntry[] = caption.cues.map((cue) => {
        return {
          type: "segment",
          text: cue.text,
          startTime: cue.startTime,
          endTime: cue.endTime,
          timeline: [],
        };
      });
      wordTimeline = await EnjoyApp.echogarden.alignSegments(
        new Uint8Array(await blob.arrayBuffer()),
        segmentTimeline,
        {
          language: languageCode,
          isolate,
        }
      );
    }

    // Get sentence timeline from the word timeline
    const timeline = await EnjoyApp.echogarden.wordToSentenceTimeline(
      wordTimeline,
      res.text,
      languageCode
    );

    return {
      engine: "cloudflare",
      model: "@cf/openai/whisper",
      transcript: res.text,
      timeline,
    };
  };

  const transcribeByAzureAi = async (
    file: File,
    language: string,
    params?: {
      targetId?: string;
      targetType?: string;
    }
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    tokenId: number;
    timeline?: TimelineEntry[];
  }> => {
    const { id, token, region } = await webApi.generateSpeechToken({
      ...params,
      purpose: "transcribe",
    });
    const config = sdk.SpeechConfig.fromAuthorizationToken(token, region);
    const audioConfig = sdk.AudioConfig.fromWavFileInput(file);
    // setting the recognition language to learning language, such as 'en-US'.
    config.speechRecognitionLanguage = language;
    config.requestWordLevelTimestamps();
    config.outputFormat = sdk.OutputFormat.Detailed;
    config.setProfanity(sdk.ProfanityOption.Raw);

    // create the speech recognizer.
    const reco = new sdk.SpeechRecognizer(config, audioConfig);

    setOutput("Transcribing from Azure...");
    const result: sdk.SpeechRecognitionResult = await new Promise(
      (resolve, reject) => {
        reco.recognizeOnceAsync(
          (result: sdk.SpeechRecognitionResult) => {
            reco.close();
            setOutput(result.text);
            resolve(result);
          },

          (error) => {
            reco.close();
            setOutput(error);
            reject(error);
          }
        );
      }
    );

    setOutput("Aligning the transcript...");
    const wordTimeline: Timeline = [];
    const transcript = result.text;
    const resultObject = JSON.parse(result.json);
    const bestResult = resultObject.NBest[0];
    if (!bestResult) {
      throw new Error("No best result found");
    }
    for (const word of bestResult.Words) {
      wordTimeline.push({
        type: "word",
        text: word.Word,
        startTime: word.Offset / 10000000.0,
        endTime: (word.Offset + word.Duration) / 10000000.0,
      });
    }

    const timeline = await EnjoyApp.echogarden.wordToSentenceTimeline(
      wordTimeline,
      transcript,
      language.split("-")[0]
    );

    return {
      engine: "azure",
      model: "whisper",
      transcript,
      timeline,
      tokenId: id,
    };
  };

  return {
    transcode,
    transcribe,
    output,
  };
};
