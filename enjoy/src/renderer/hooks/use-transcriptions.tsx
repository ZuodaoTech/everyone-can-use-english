import { useState, useContext, useEffect } from "react";
import { useTranscribe } from "@renderer/hooks";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";

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
    if (model === "Transcription" && action === "update") {
      setTranscription(record);
    }
  };
  const findOrCreateTranscription = async () => {
    if (!media) return;
    if (transcription) return;

    return EnjoyApp.transcriptions
      .findOrCreate({
        targetId: media.id,
        targetType: media.mediaType,
      })
      .then((transcription) => {
        setTranscription(transcription);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const generateTranscription = async () => {
    if (transcribing) return;
    if (!transcription) {
      await findOrCreateTranscription();
    }

    setTranscribing(true);
    setTranscribingProgress(0);
    try {
      const { engine, model, result } = await transcribe(media.src, {
        targetId: media.id,
        targetType: media.mediaType,
      });
      await EnjoyApp.transcriptions.update(transcription.id, {
        state: "finished",
        result,
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
      ["base", "small", "medium", "large", "whisper-1"].includes(t.model)
    )?.[0];

    if (!transcript) {
      throw new Error("Transcription not found");
    }

    await EnjoyApp.transcriptions.update(transcription.id, {
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
      console.error(err);
      await generateTranscription();
    }
  };

  useEffect(() => {
    if (!media) return;

    findOrCreateTranscription();
  }, [media]);

  useEffect(() => {
    if (!transcription) return;

    addDblistener(onTransactionUpdate);

    if (transcription?.state == "pending") {
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
