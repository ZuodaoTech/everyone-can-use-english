import { useState, useContext, useEffect } from "react";
import { useTranscribe } from "@renderer/hooks";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { MAGIC_TOKEN_REGEX, END_OF_SENTENCE_REGEX } from "@/constants";

export const useTranscriptions = (media: AudioType | VideoType) => {
  const { whisperConfig } = useContext(AISettingsProviderContext);
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [transcription, setTranscription] = useState<TranscriptionType>(null);
  const { transcribe } = useTranscribe();
  const [transcribingProgress, setTranscribingProgress] = useState<number>(0);
  const [transcribing, setTranscribing] = useState<boolean>(false);

  const onTransactionUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (
      model === "Transcription" &&
      record.id === transcription.id &&
      action === "update"
    ) {
      setTranscription(record);
    }
  };
  const findOrCreateTranscription =
    async (): Promise<TranscriptionType | void> => {
      if (!media) return;
      if (transcription?.targetId === media.id) return;

      return EnjoyApp.transcriptions
        .findOrCreate({
          targetId: media.id,
          targetType: media.mediaType,
        })
        .then((t) => {
          if (t.result && !t.result["timeline"]) {
            t.result = {
              originalText: t.result?.originalText,
            };
          }
          setTranscription(t);
          return t;
        })
        .catch((err) => {
          toast.error(err.message);
        });
    };

  const generateTranscription = async (params?: {
    originalText?: string;
    language?: string;
  }) => {
    let { originalText, language } = params || {};
    if (originalText === undefined) {
      if (transcription?.targetId === media.id) {
        originalText = transcription.result?.originalText;
      } else {
        const r = await findOrCreateTranscription();
        if (r) {
          originalText = r.result?.originalText;
        }
      }
    }

    setTranscribing(true);
    setTranscribingProgress(0);
    try {
      const { engine, model, alignmentResult } = await transcribe(media.src, {
        targetId: media.id,
        targetType: media.mediaType,
        originalText,
        language,
      });

      let timeline: TimelineEntry[] = [];
      alignmentResult.timeline.forEach((t) => {
        if (t.type === "sentence") {
          timeline.push(t);
        } else {
          t.timeline.forEach((st) => {
            timeline.push(st);
          });
        }
      });

      /*
       * Pre-process
       * 1. Some words end with period should not be a single sentence, like Mr./Ms./Dr. etc
       * 2. Some words connected by `-`(like scrach-off) are split into multiple words in words timeline, merge them for display;
       * 3. Some numbers with `%` are split into `number + percent` in words timeline, merge them for display;
       */
      try {
        timeline.forEach((sentence, i) => {
          const nextSentence = timeline[i + 1];
          if (
            !sentence.text
              .replaceAll(MAGIC_TOKEN_REGEX, "")
              .match(END_OF_SENTENCE_REGEX) &&
            nextSentence?.text
          ) {
            nextSentence.text = [sentence.text, nextSentence.text].join(" ");
            nextSentence.timeline = [
              ...sentence.timeline,
              ...nextSentence.timeline,
            ];
            nextSentence.startTime = sentence.startTime;
            timeline.splice(i, 1);
          } else {
            const words = sentence.text.split(" ");

            sentence.timeline.forEach((token, j) => {
              const word = words[j]?.trim()?.toLowerCase();

              const match = word?.match(/-|%/);
              if (!match) return;

              if (
                word === "-" &&
                token.text.toLowerCase() === words[j + 1]?.trim()?.toLowerCase()
              ) {
                sentence.timeline.splice(j, 0, {
                  type: "token",
                  text: "-",
                  startTime: sentence.timeline[j - 1]?.endTime || 0,
                  endTime: sentence.timeline[j - 1]?.endTime || 0,
                  timeline: [],
                });
                return;
              }

              for (let k = j + 1; k <= sentence.timeline.length - 1; k++) {
                if (word.includes(sentence.timeline[k].text.toLowerCase())) {
                  let connector = "";
                  if (match[0] === "-") {
                    connector = "-";
                  }
                  token.text = [token.text, sentence.timeline[k].text].join(
                    connector
                  );
                  token.timeline = [
                    ...token.timeline,
                    ...sentence.timeline[k].timeline,
                  ];
                  token.endTime = sentence.timeline[k].endTime;
                  sentence.timeline.splice(k, 1);
                } else {
                  break;
                }
              }
            });
          }
        });
      } catch (err) {
        console.error(err);
      }

      await EnjoyApp.transcriptions.update(transcription.id, {
        state: "finished",
        result: {
          timeline: timeline,
          transcript: alignmentResult.transcript,
          originalText,
        },
        engine,
        model,
      });
    } catch (err) {
      toast.error(err.message);
    }

    setTranscribing(false);
  };

  const findTranscriptionFromWebApi = async () => {
    if (!transcription) {
      await findOrCreateTranscription();
    }

    const res = await webApi.transcriptions({
      targetMd5: media.md5,
    });

    const transcript = (res?.transcriptions || []).filter((t) =>
      ["base", "small", "medium", "large", "whisper-1", "original"].includes(
        t.model
      )
    )?.[0];

    if (!transcript) {
      return Promise.reject("Transcription not found");
    }

    if (!transcript.result["timeline"]) {
      return Promise.reject("Transcription not aligned");
    }

    return EnjoyApp.transcriptions.update(transcription.id, {
      state: "finished",
      result: transcript.result,
      engine: transcript.engine,
      model: transcript.model,
    });
  };

  const findOrGenerateTranscription = async () => {
    try {
      await findTranscriptionFromWebApi();
    } catch (err) {
      console.warn(err);
      await generateTranscription();
    }
  };

  /*
   * find or create transcription
   */
  useEffect(() => {
    if (!media) return;

    findOrCreateTranscription();
  }, [media]);

  /*
   * auto-generate transcription result
   */
  useEffect(() => {
    if (!transcription) return;

    addDblistener(onTransactionUpdate);

    if (
      transcription.state == "pending" ||
      !transcription.result?.["timeline"]
    ) {
      findOrGenerateTranscription();
    }

    if (whisperConfig.service === "local") {
      EnjoyApp.whisper.onProgress((_, p: number) => {
        if (p > 100) p = 100;
        setTranscribingProgress(p);
      });
    }

    return () => {
      removeDbListener(onTransactionUpdate);
      EnjoyApp.whisper.removeProgressListeners();
    };
  }, [transcription, media]);

  return {
    transcription,
    transcribingProgress,
    transcribing,
    generateTranscription,
  };
};
