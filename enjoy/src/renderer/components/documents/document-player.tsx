import {
  AppSettingsProviderContext,
  DocumentProviderContext,
} from "@renderer/context";
import { useSpeech } from "@renderer/hooks";
import { useContext, useEffect, useState } from "react";
import { Button, toast } from "@renderer/components/ui";
import {
  AudioPlayer,
  LoaderSpin,
  WavesurferPlayer,
} from "@renderer/components";
import { t } from "i18next";
import { LoaderIcon } from "lucide-react";

export const DocumentPlayer = () => {
  const { ref, document, section, playingParagraph } = useContext(
    DocumentProviderContext
  );
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [paragraph, setParagraph] = useState<{
    index: number;
    text: string;
  } | null>(null);
  const [speech, setSpeech] = useState<SpeechType | null>(null);
  const [speeching, setSpeeching] = useState(false);
  const [resourcing, setResourcing] = useState(false);
  const { tts } = useSpeech();
  const [audio, setAudio] = useState<AudioType | null>(null);

  const findParagraph = () => {
    if (!playingParagraph) return;

    const element: HTMLElement | null = ref.current?.querySelector(
      `#${playingParagraph}`
    );
    console.log("findParagraph", element);
    if (!element) return;

    setParagraph({
      index: parseInt(element.dataset.index),
      text: element.textContent.trim(),
    });
  };

  const startShadow = async () => {
    if (!speech) return;

    const audio = await EnjoyApp.audios.findOne({
      md5: speech.md5,
    });

    if (audio) {
      setAudio(audio);
    } else {
      setResourcing(true);
      EnjoyApp.audios
        .create(speech.filePath, {
          name: `[S${section}P${paragraph.index}]-${document.title}`,
          originalText: speech.text,
        })
        .then((audio) => setAudio(audio))
        .catch((err) => toast.error(err.message))
        .finally(() => setResourcing(false));
    }
  };

  const findOrCreateSpeech = async () => {
    if (typeof section !== "number" || !paragraph) return;

    const existingSpeech = await EnjoyApp.speeches.findOne({
      sourceId: document.id,
      sourceType: "Document",
      section,
      paragraph: paragraph.index,
    });

    if (existingSpeech) {
      setSpeech(existingSpeech);
    } else {
      createSpeech();
    }
  };

  const createSpeech = async () => {
    if (speeching) return;

    setSpeeching(true);
    tts({
      sourceId: document.id,
      sourceType: "Document",
      section,
      paragraph: paragraph.index,
      text: paragraph.text,
      configuration: document.config.tts,
    })
      .then((res) => {
        setSpeech(res);
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setSpeeching(false);
      });
  };

  useEffect(() => {
    findOrCreateSpeech();

    return () => {
      setSpeech(null);
      setAudio(null);
    };
  }, [document, section, paragraph]);

  useEffect(() => {
    if (!ref.current) return;

    findParagraph();

    return () => {
      setParagraph(null);
    };
  }, [ref, playingParagraph]);

  if (typeof section !== "number" || !paragraph) {
    return <LoaderSpin />;
  }

  if (speeching) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <div className="flex items-center justify-center mb-2">
          <LoaderIcon className="animate-spin text-muted-foreground" />
        </div>
        <div className="text-muted-foreground text-sm">
          {t("creatingSpeech")}
        </div>
      </div>
    );
  }

  if (resourcing) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <div className="flex items-center justify-center mb-2">
          <LoaderIcon className="animate-spin text-muted-foreground" />
        </div>
        <div className="text-muted-foreground text-sm">
          {t("preparingAudio")}
        </div>
      </div>
    );
  }

  if (!speech) {
    return (
      <div className="flex justify-center items-center h-full">
        <Button onClick={createSpeech}>{t("textToSpeech")}</Button>
      </div>
    );
  }

  if (!audio) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center h-full">
        <WavesurferPlayer
          id={speech.id}
          src={speech.src}
          autoplay={true}
          className="w-full h-full"
        />
        <div className="flex justify-center">
          <Button onClick={startShadow}>{t("shadowingExercise")}</Button>
        </div>
      </div>
    );
  }

  return <AudioPlayer id={audio.id} md5={audio.md5} />;
};
