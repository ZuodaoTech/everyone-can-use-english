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

// define the regex pattern to match the end of a sentence
// the end of a sentence is defined as a period, question mark, or exclamation mark
// also it may be followed by a quotation mark
// and exclude sepecial cases like "Mr.", "Mrs.", "Dr.", "Ms.", "etc."
const sentenceEndPattern = /(?<!Mr|Mrs|Dr|Ms|etc)\.|\?|!\"?/;

export const useTranscribe = () => {
  const { EnjoyApp, user, webApi } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);
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
    mediaSrc: string,
    params?: {
      targetId?: string;
      targetType?: string;
      originalText?: string;
      language: string;
      service: WhisperConfigType["service"];
      isolate?: boolean;
    }
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    timeline: TimelineEntry[];
    originalText?: string;
    tokenId?: number;
  }> => {
    const url = await transcode(mediaSrc);
    const {
      targetId,
      targetType,
      originalText,
      language,
      service,
      isolate = false,
    } = params || {};
    const blob = await (await fetch(url)).blob();

    let result: any;
    if (originalText) {
      result = {
        engine: "original",
        model: "original",
      };
    } else if (service === "local") {
      result = await transcribeByLocal(url, language);
    } else if (service === "cloudflare") {
      result = await transcribeByCloudflareAi(blob);
    } else if (service === "openai") {
      result = await transcribeByOpenAi(
        new File([blob], mediaSrc.split("/").pop())
      );
    } else if (service === "azure") {
      result = await transcribeByAzureAi(blob, language, {
        targetId,
        targetType,
      });
    } else {
      throw new Error(t("whisperServiceNotSupported"));
    }

    setOutput(null);

    let transcript = originalText || result.text;

    // Remove all content inside `()`, `[]`, `{}` and trim the text
    // remove all markdown formatting
    transcript = transcript
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\{.*?\}/g, "")
      .replace(/[*_`]/g, "")
      .trim();

    // if the transcript does not contain any punctuation, use AI command to add punctuation
    if (!transcript.match(/\w[.,!?](\s|$)/)) {
      try {
        transcript = await punctuateText(transcript);
      } catch (err) {
        toast.error(err.message);
        console.warn(err.message);
      }
    }

    let timeline: Timeline = [];
    if (result.timeline) {
      timeline = Object.assign([], result.timeline);
      console.log(timeline);
      const wordTimeline = await EnjoyApp.echogarden.alignSegments(
        new Uint8Array(await blob.arrayBuffer()),
        timeline,
        {
          language,
          isolate,
        }
      );

      wordTimeline.forEach((word: TimelineEntry) => {
        let sentence = timeline.find(
          (entry) =>
            word.startTime >= entry.startTime && word.endTime <= entry.endTime
        );

        if (sentence) {
          sentence.timeline.push(word);
        }
      });

      // transcript = timeline.map((entry) => entry.text).join(" ");
    } else {
      const alignmentResult = await EnjoyApp.echogarden.align(
        new Uint8Array(await blob.arrayBuffer()),
        transcript,
        {
          language,
          isolate,
        }
      );
      timeline = alignmentResult.timeline;
    }

    return {
      ...result,
      originalText,
      timeline,
    };
  };

  const transcribeByLocal = async (
    url: string,
    language?: string
  ): Promise<{
    engine: string;
    model: string;
    text: string;
    timeline: TimelineEntry[];
  }> => {
    const res = await EnjoyApp.whisper.transcribe(
      {
        file: url,
      },
      {
        language,
        force: true,
        extra: ["--prompt", `"Hello! Welcome to listen to this audio."`],
      }
    );

    const timeline: TimelineEntry[] = [];
    res.transcription.forEach((word, index) => {
      word.text = word.text.trim();
      // skip empty words
      if (!word.text) return;
      // skip music or sound effects quoted in []
      if (word.text.match(/^\[.*\]$/)) return;

      const wordTimeline = {
        type: "word" as TimelineEntryType,
        text: word.text,
        startTime: word.offsets.from / 1000.0,
        endTime: word.offsets.to / 1000.0,
      };

      let sentence: TimelineEntry;
      // get the last sentence in the timeline
      if (timeline.length > 0) {
        sentence = timeline[timeline.length - 1];
      }

      // if there is no sentence in the timeline, create a new sentence
      // if last sentence is a punctuation, create a new sentence
      if (!sentence || sentence.text.match(sentenceEndPattern)) {
        sentence = {
          type: "sentence" as TimelineEntryType,
          text: "",
          startTime: wordTimeline.startTime,
          endTime: wordTimeline.endTime,
          timeline: [],
        };
        timeline.push(sentence);
      }

      // if the word is a punctuation, add it to the sentence and start a new sentence
      if (wordTimeline.text.match(sentenceEndPattern)) {
        sentence.text += wordTimeline.text;
        sentence.endTime = wordTimeline.endTime;

        const lastSentence = timeline[timeline.length - 1];
        if (lastSentence.endTime !== sentence.endTime) {
          timeline.push(sentence);
        }
      } else {
        sentence.text += wordTimeline.text + " ";
        sentence.endTime = wordTimeline.endTime;

        if (index === res.transcription.length - 1) {
          timeline.push(sentence);
        }
      }
    });

    return {
      engine: "whisper",
      model: res.model.type,
      text: res.transcription.map((segment) => segment.text).join(" "),
      timeline,
    };
  };

  const transcribeByOpenAi = async (file: File) => {
    if (!openai?.key) {
      throw new Error(t("openaiKeyRequired"));
    }

    const client = new OpenAI({
      apiKey: openai.key,
      baseURL: openai.baseUrl,
      dangerouslyAllowBrowser: true,
      maxRetries: 0,
    });

    const res: {
      text: string;
      words?: { word: string; start: number; end: number }[];
      segments?: { text: string; start: number; end: number }[];
    } = (await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    })) as any;

    const timeline: TimelineEntry[] = [];

    if (res.segments) {
      res.segments.forEach((segment) => {
        const segmentTimeline = {
          type: "sentence" as TimelineEntryType,
          text: segment.text,
          startTime: segment.start,
          endTime: segment.end,
          timeline: [] as Timeline,
        };

        timeline.push(segmentTimeline);
      });
    } else if (res.words) {
      res.words.forEach((word) => {
        const wordTimeline = {
          type: "word" as TimelineEntryType,
          text: word.word,
          startTime: word.start,
          endTime: word.end,
        };

        let sentence: TimelineEntry;
        // get the last sentence in the timeline
        if (timeline.length > 0) {
          sentence = timeline[timeline.length - 1];
        }

        // if there is no sentence in the timeline, create a new sentence
        // if last sentence is a punctuation, create a new sentence
        if (!sentence || sentence.text.match(sentenceEndPattern)) {
          sentence = {
            type: "sentence" as TimelineEntryType,
            text: "",
            startTime: wordTimeline.startTime,
            endTime: 0,
            timeline: [],
          };
          timeline.push(sentence);
        }

        // if the word is a punctuation, add it to the sentence and start a new sentence
        if (wordTimeline.text.match(sentenceEndPattern)) {
          sentence.text += wordTimeline.text;
          sentence.endTime = wordTimeline.endTime;

          const lastSentence = timeline[timeline.length - 1];
          if (lastSentence.endTime !== sentence.endTime) {
            timeline.push(sentence);
          }
          return;
        } else {
          sentence.text += wordTimeline.text + " ";
          sentence.endTime = wordTimeline.endTime;
        }
      });
    }

    return {
      engine: "openai",
      model: "whisper-1",
      text: res.text,
      timeline,
    };
  };

  const transcribeByCloudflareAi = async (
    blob: Blob
  ): Promise<{
    engine: string;
    model: string;
    text: string;
    timeline?: TimelineEntry[];
  }> => {
    const res: CfWhipserOutputType = (
      await axios.postForm(`${AI_WORKER_ENDPOINT}/audio/transcriptions`, blob, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        timeout: 1000 * 60 * 5,
      })
    ).data;

    let timeline: TimelineEntry[] = [];
    res.words.forEach((word) => {
      const wordTimeline = {
        type: "word" as TimelineEntryType,
        text: word.word,
        startTime: word.start,
        endTime: word.end,
      };

      let sentence: TimelineEntry;
      // get the last sentence in the timeline
      if (timeline.length > 0) {
        sentence = timeline[timeline.length - 1];
      }

      // if there is no sentence in the timeline, create a new sentence
      // if last sentence is a punctuation, create a new sentence
      if (!sentence || sentence.text.match(sentenceEndPattern)) {
        sentence = {
          type: "sentence" as TimelineEntryType,
          text: "",
          startTime: wordTimeline.startTime,
          endTime: 0,
          timeline: [],
        };
        timeline.push(sentence);
      }

      // if the word is a punctuation, add it to the sentence and start a new sentence
      if (wordTimeline.text.match(sentenceEndPattern)) {
        sentence.text += wordTimeline.text;
        sentence.endTime = wordTimeline.endTime;

        const lastSentence = timeline[timeline.length - 1];
        if (lastSentence.endTime !== sentence.endTime) {
          timeline.push(sentence);
        }
        return;
      } else {
        sentence.text += wordTimeline.text + " ";
        sentence.endTime = wordTimeline.endTime;
      }

      if (word === res.words[res.words.length - 1]) {
        timeline.push(sentence);
      }
    });

    return {
      engine: "cloudflare",
      model: "@cf/openai/whisper",
      text: res.text,
      timeline,
    };
  };

  const transcribeByAzureAi = async (
    blob: Blob,
    language: string,
    params?: {
      targetId?: string;
      targetType?: string;
    }
  ): Promise<{
    engine: string;
    model: string;
    text: string;
    tokenId: number;
    timeline?: TimelineEntry[];
  }> => {
    const { id, token, region } = await webApi.generateSpeechToken(params);
    const config = sdk.SpeechConfig.fromAuthorizationToken(token, region);
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      new File([blob], "audio.wav")
    );
    // setting the recognition language to learning language, such as 'en-US'.
    config.speechRecognitionLanguage = language;
    config.requestWordLevelTimestamps();
    config.outputFormat = sdk.OutputFormat.Detailed;

    // create the speech recognizer.
    const reco = new sdk.SpeechRecognizer(config, audioConfig);

    let results: SpeechRecognitionResultType[] = [];

    return new Promise((resolve, reject) => {
      reco.recognizing = (_s, e) => {
        console.log(e.result);
        setOutput(e.result.text);
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
          tokenId: id,
        });
      };

      reco.startContinuousRecognitionAsync();
    });
  };

  return {
    transcode,
    transcribe,
    output,
  };
};
