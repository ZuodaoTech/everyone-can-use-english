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
import { t } from "i18next";

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

  const generateTranscription = async () => {
    let originalText: string;
    if (transcription?.targetId === media.id) {
      originalText = transcription.result?.originalText;
    } else {
      const r = await findOrCreateTranscription();
      if (r) {
        originalText = r.result?.originalText;
      }
    }

    setTranscribing(true);
    setTranscribingProgress(0);
    try {
      const { engine, model, alignmentResult } = await transcribe(media.src, {
        targetId: media.id,
        targetType: media.mediaType,
        originalText,
      });

      let timeline: TimelineEntry[] = [];
      if (alignmentResult) {
        alignmentResult.timeline.forEach((t) => {
          if (t.type === "sentence") {
            timeline.push(t);
          } else {
            t.timeline.forEach((st) => {
              timeline.push(st);
            });
          }
        });
      } else {
        throw new Error(t("forceAlignmentFailed"));
      }

      /*
       * Pre-process
       * Some words end with period should not be a single sentence, like Mr./Ms./Dr. etc
       */
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
        }
      });

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
