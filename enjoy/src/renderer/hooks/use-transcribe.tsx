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
  TimelineEntry,
  type TimelineEntryType,
} from "echogarden/dist/utilities/Timeline";
import { type ParsedCaptionsResult, parseText } from "media-captions";
import { SttEngineOptionEnum } from "@/types/enums";
import { RecognitionResult } from "echogarden/dist/api/API.js";
import take from "lodash/take";
import sortedUniqBy from "lodash/sortedUniqBy";
import log from "electron-log/renderer";

const logger = log.scope("use-transcribe.tsx");

// test a text string has any punctuations or not
// some transcribed text may not have any punctuations
const punctuationsPattern = /\w[.,!?](\s|$)/g;

export const useTranscribe = () => {
  const { EnjoyApp, user, webApi } = useContext(AppSettingsProviderContext);
  const { openai, echogardenSttConfig } = useContext(AISettingsProviderContext);
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
      result = await alignText(originalText);
    } else if (service === SttEngineOptionEnum.LOCAL) {
      result = await transcribeByLocal(url, {
        language,
      });
    } else if (service === SttEngineOptionEnum.ENJOY_CLOUDFLARE) {
      result = await transcribeByCloudflareAi(blob);
    } else if (service === SttEngineOptionEnum.OPENAI) {
      result = await transcribeByOpenAi(
        new File([blob], "audio.mp3", { type: "audio/mp3" })
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

    const { segmentTimeline, transcript } = result;

    if (!align && transcript) {
      return {
        ...result,
        timeline: [],
        url,
      };
    }

    if (segmentTimeline && segmentTimeline.length > 0) {
      const wordTimeline = await EnjoyApp.echogarden.alignSegments(
        new Uint8Array(await blob.arrayBuffer()),
        segmentTimeline,
        {
          engine: "dtw",
          language: language.split("-")[0],
          isolate,
        }
      );

      const timeline = await EnjoyApp.echogarden.wordToSentenceTimeline(
        wordTimeline,
        transcript,
        language.split("-")[0]
      );

      return {
        ...result,
        timeline,
        url,
      };
    } else if (transcript) {
      setOutput("Aligning the transcript...");
      logger.info("Aligning the transcript...");
      const alignmentResult = await EnjoyApp.echogarden.align(
        new Uint8Array(await blob.arrayBuffer()),
        transcript,
        {
          engine: "dtw",
          language: language.split("-")[0],
          isolate,
        }
      );

      const timeline: TimelineEntry[] = [];
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
        ...result,
        timeline,
        url,
      };
    } else {
      throw new Error(t("transcribeFailed"));
    }
  };

  const alignText = async (
    originalText: string
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    segmentTimeline: TimelineEntry[];
  }> => {
    let caption: ParsedCaptionsResult;
    try {
      caption = await parseText(originalText, { type: "srt" });
    } catch (err) {
      logger.error("parseTextFailed", { error: err.message });
      throw err;
    }

    if (caption.cues.length > 0) {
      // valid srt file
      const segmentTimeline = caption.cues.map((cue) => {
        return {
          type: "segment",
          text: cue.text,
          startTime: cue.startTime,
          endTime: cue.endTime,
          timeline: [],
        } as TimelineEntry;
      });

      return {
        engine: "upload",
        model: "-",
        transcript: segmentTimeline
          .map((entry: TimelineEntry) => entry.text)
          .join(" "),
        segmentTimeline,
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
          const punctuatedText = await punctuateText(transcript);
          transcript = punctuatedText;
        } catch (err) {
          toast.error(err.message);
          logger.error("punctuateTextFailed", { error: err.message });
        }
      }

      return {
        engine: "upload",
        model: "-",
        transcript,
        segmentTimeline: [],
      };
    }
  };

  const transcribeByLocal = async (
    url: string,
    options: { language: string }
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    segmentTimeline: TimelineEntry[];
  }> => {
    let { language } = options || {};
    const languageCode = language.split("-")[0];
    let model: string;

    let res: RecognitionResult;
    logger.info("Start transcribing from Whisper...");
    try {
      model =
        echogardenSttConfig[
          echogardenSttConfig.engine.replace(".cpp", "Cpp") as
            | "whisper"
            | "whisperCpp"
        ].model;
      res = await EnjoyApp.echogarden.recognize(url, {
        language: languageCode,
        ...echogardenSttConfig,
      });
    } catch (err) {
      throw new Error(t("whisperTranscribeFailed", { error: err.message }));
    }

    setOutput("Whisper transcribe done");
    const { transcript, timeline } = res;

    return {
      engine: "whisper",
      model,
      transcript,
      segmentTimeline: timeline,
    };
  };

  const transcribeByOpenAi = async (
    file: File
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    segmentTimeline: TimelineEntry[];
  }> => {
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
    logger.info("Start transcribing from OpenAI...");
    try {
      const res: {
        text: string;
        words?: { word: string; start: number; end: number }[];
        segments?: { text: string; start: number; end: number }[];
      } = (await client.audio.transcriptions.create({
        file,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word", "segment"],
      })) as any;

      setOutput("OpenAI transcribe done");
      const segmentTimeline = (res.segments || []).map((segment) => {
        return {
          type: "segment" as TimelineEntryType,
          text: segment.text,
          startTime: segment.start,
          endTime: segment.end,
          timeline: [] as TimelineEntry[],
        };
      });

      return {
        engine: "openai",
        model: "whisper-1",
        transcript: res.text,
        segmentTimeline,
      };
    } catch (err) {
      throw new Error(t("openaiTranscribeFailed", { error: err.message }));
    }
  };

  const transcribeByCloudflareAi = async (
    blob: Blob
  ): Promise<{
    engine: string;
    model: string;
    transcript: string;
    segmentTimeline: TimelineEntry[];
  }> => {
    setOutput("Transcribing from Cloudflare...");
    logger.info("Start transcribing from Cloudflare...");
    try {
      const res: CfWhipserOutputType = (
        await axios.postForm(
          `${AI_WORKER_ENDPOINT}/audio/transcriptions`,
          blob,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
            timeout: 1000 * 60 * 5,
          }
        )
      ).data;

      setOutput("Cloudflare transcribe done");
      const segmentTimeline: TimelineEntry[] = [];
      if (res.vtt) {
        const caption = await parseText(res.vtt, { type: "vtt" });
        for (const cue of caption.cues) {
          segmentTimeline.push({
            type: "segment",
            text: cue.text,
            startTime: cue.startTime,
            endTime: cue.endTime,
            timeline: [],
          });
        }
      }

      return {
        engine: "cloudflare",
        model: "@cf/openai/whisper",
        transcript: res.text,
        segmentTimeline,
      };
    } catch (err) {
      throw new Error(t("cloudflareTranscribeFailed", { error: err.message }));
    }
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
    segmentTimeline: TimelineEntry[];
    tokenId: number;
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
    logger.info("Start transcribing from Azure...");
    let results: SpeechRecognitionResultType[] = [];

    const { transcript, segmentTimeline }: any = await new Promise(
      (resolve, reject) => {
        reco.recognizing = (_s, e) => {
          setOutput((prev) => prev + e.result.text);
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
            logger.error("Azure transcribe canceled: Reason=" + e.reason);
            return reject(new Error(e.errorDetails));
          }

          reco.stopContinuousRecognitionAsync();
          logger.info("Azure transcribe canceled: Reason=" + e.reason);
        };

        reco.sessionStopped = async (_s, e) => {
          logger.info(
            "Azure transcribe session stopped. Stop continuous recognition.",
            e.sessionId
          );
          reco.stopContinuousRecognitionAsync();

          if (results.length === 0) {
            return reject(t("azureTranscribeFailed", { error: "" }));
          }

          try {
            const transcript = results
              .map((result) => result.DisplayText)
              .join(" ");
            const segmentTimeline: TimelineEntry[] = [];
            results.forEach((result) => {
              if (!result.DisplayText) return;

              const best = take(sortedUniqBy(result.NBest, "Confidence"), 1)[0];
              if (!best.Words) return;
              if (!best.Confidence || best.Confidence < 0.5) return;

              const firstWord = best.Words[0];
              const lastWord = best.Words[best.Words.length - 1];

              segmentTimeline.push({
                type: "segment",
                text: best.Display,
                startTime: firstWord.Offset / 10000000.0,
                endTime: (lastWord.Offset + lastWord.Duration) / 10000000.0,
                timeline: [],
              });
            });

            resolve({
              transcript,
              segmentTimeline,
            });
          } catch (err) {
            logger.error("azureTranscribeFailed", { error: err.message });
            reject(t("azureTranscribeFailed", { error: err.message }));
          }
        };
        reco.startContinuousRecognitionAsync();
      }
    );

    return {
      engine: "azure",
      model: "whisper",
      transcript,
      segmentTimeline,
      tokenId: id,
    };
  };

  return {
    transcode,
    transcribe,
    output,
  };
};
