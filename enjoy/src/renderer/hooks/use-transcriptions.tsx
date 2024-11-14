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
import { SttEngineOptionEnum } from "@/types/enums";
import { t } from "i18next";

export const useTranscriptions = (media: AudioType | VideoType) => {
  const { sttEngine } = useContext(AISettingsProviderContext);
  const { EnjoyApp, learningLanguage, webApi } = useContext(
    AppSettingsProviderContext
  );
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [transcription, setTranscription] = useState<TranscriptionType>(null);
  const { transcribe, output } = useTranscribe();
  const [transcribingProgress, setTranscribingProgress] = useState<number>(0);
  const [transcribing, setTranscribing] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [transcribingOutput, setTranscribingOutput] = useState<string>("");
  const [service, setService] = useState<SttEngineOptionEnum | "upload">(
    sttEngine
  );

  const onTransactionUpdate = (event: CustomEvent) => {
    if (!transcription) return;

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
      if (creating) return;

      try {
        setCreating(true);
        const tr = await EnjoyApp.transcriptions.findOrCreate({
          targetId: media.id,
          targetType: media.mediaType,
        });

        if (!tr?.result?.timeline) {
          tr.result = {
            originalText: tr.result?.originalText,
          };
        }

        const transcriptionOnline = await findTranscriptionOnline();
        if (transcriptionOnline && !tr?.result?.timeline) {
          await EnjoyApp.transcriptions.update(tr.id, {
            state: "finished",
            result: transcriptionOnline.result,
            engine: transcriptionOnline.engine,
            model: transcriptionOnline.model,
            language: transcriptionOnline.language || media.language,
          });
          setTranscription(transcriptionOnline);
          toast.success(t("downloadedTranscriptionFromCloud"));
          if (transcribing) {
            abortGenerateTranscription();
          }
          return transcriptionOnline;
        } else {
          setTranscription(tr);
          return tr;
        }
      } catch (err) {
        console.error(err);
        return null;
      } finally {
        setCreating(false);
      }
    };

  const findTranscriptionOnline = async () => {
    if (!media) return;

    try {
      const result = await webApi.transcriptions({
        targetMd5: media.md5,
        items: 10,
      });
      if (result.transcriptions.length) {
        for (const tr of result.transcriptions) {
          if (validateTranscription(tr)) {
            return tr;
          } else {
            console.warn(`Invalid transcription: ${tr.id}`);
          }
        }
      } else {
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const generateTranscription = async (params?: {
    originalText?: string;
    language?: string;
    service?: SttEngineOptionEnum | "upload";
    isolate?: boolean;
  }) => {
    let {
      originalText,
      language = learningLanguage,
      service = sttEngine,
      isolate = false,
    } = params || {};
    setService(service);
    setTranscribing(true);
    setTranscribingProgress(0);

    try {
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
      const { engine, model, transcript, timeline, tokenId } = await transcribe(
        media.src,
        {
          targetId: media.id,
          targetType: media.mediaType,
          originalText,
          language,
          service,
          isolate,
        }
      );

      const processedTimeline = preProcessTranscription(timeline);
      if (media.language !== language) {
        if (media.mediaType === "Video") {
          await EnjoyApp.videos.update(media.id, {
            language,
          });
        } else {
          await EnjoyApp.audios.update(media.id, {
            language,
          });
        }
      }

      await EnjoyApp.transcriptions.update(transcription.id, {
        state: "finished",
        result: {
          timeline: processedTimeline,
          transcript,
          originalText,
          tokenId,
        },
        engine,
        model,
        language,
      });

      setTranscribing(false);
    } catch (err) {
      setTranscribing(false);
      toast.error(err.message);
    }
  };

  const preProcessTranscription = (timeline: TimelineEntry[]) => {
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
              while (word.includes(sentence.timeline[k]?.text?.toLowerCase())) {
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
              }
              break;
            }
          });
        }
      });
    } catch (err) {
      console.warn(err);
      toast.warning(
        `Failed to pre-process transcription timeline: ${err.message}`
      );
    }
    return timeline;
  };

  const validateTranscription = (transcription: TranscriptionType) => {
    if (!transcription) return;

    const { timeline, transcript } = transcription.result;
    if (!timeline || !transcript) {
      return false;
    }

    if (timeline[0]?.type !== "sentence") {
      return false;
    }

    return true;
  };

  /*
   * find or create transcription
   */
  useEffect(() => {
    if (!media) return;

    findOrCreateTranscription();
  }, [media]);

  /*
   * listen to transcription update
   */
  useEffect(() => {
    if (!transcription) return;

    addDblistener(onTransactionUpdate);
    return () => {
      removeDbListener(onTransactionUpdate);
    };
  }, [transcription]);

  /*
   * listen to transcribe progress
   */
  useEffect(() => {
    if (!transcribing) return;

    EnjoyApp.app.onCmdOutput((_, output) => {
      setTranscribingOutput(output);
    });

    return () => {
      EnjoyApp.app.removeCmdOutputListeners();
      setTranscribingOutput(null);
    };
  }, [media, service, transcribing]);

  const abortGenerateTranscription = () => {
    setTranscribing(false);
  };

  return {
    transcription,
    transcribingProgress,
    transcribing,
    transcribingOutput: output || transcribingOutput,
    generateTranscription,
    abortGenerateTranscription,
  };
};
