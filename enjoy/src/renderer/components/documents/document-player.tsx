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
import {
  ChevronLeftIcon,
  LoaderIcon,
  LocateFixedIcon,
  RefreshCcwIcon,
  XIcon,
} from "lucide-react";

export const DocumentPlayer = () => {
  const { ref, document, section, playingParagraph, togglePlayingParagraph } =
    useContext(DocumentProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [paragraph, setParagraph] = useState<{
    id: string;
    index: number;
    text: string;
  } | null>(null);
  const [nextParagraph, setNextParagraph] = useState<{
    id: string;
    index: number;
    text: string;
  } | null>(null);
  const [speech, setSpeech] = useState<SpeechType | null>(null);
  const [speeching, setSpeeching] = useState(false);
  const [resourcing, setResourcing] = useState(false);
  const { tts } = useSpeech();
  const [audio, setAudio] = useState<AudioType | null>(null);

  const locateParagraph = (id: string) => {
    const element: HTMLElement | null = ref.current?.querySelector(`#${id}`);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("playing-paragraph", "bg-yellow-100");

    return element;
  };

  const findParagraph = () => {
    if (!playingParagraph) return;

    const element = locateParagraph(playingParagraph);
    if (!element) return;

    setParagraph({
      id: element.id,
      index: parseInt(element.dataset.index),
      text: element.querySelector(".paragraph-content")?.textContent?.trim(),
    });
  };

  const findNextParagraph = async (index: number) => {
    if (!document.config.autoNextSpeech) return;

    const next: HTMLElement | null = ref.current?.querySelector(
      `[data-index="${index}"]`
    );
    if (!next) return;

    const text = next.querySelector(".paragraph-content")?.textContent?.trim();
    if (!text) {
      return findNextParagraph(index + 1);
    }

    const existingSpeech = await EnjoyApp.speeches.findOne({
      sourceId: document.id,
      sourceType: "Document",
      section,
      paragraph: index,
    });

    if (!existingSpeech) {
      tts({
        sourceId: document.id,
        sourceType: "Document",
        section,
        paragraph: index,
        text,
        configuration: document.config.tts,
      });
    }
    setNextParagraph({
      id: next.id,
      index,
      text,
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
      createSpeech(paragraph);
    }
  };

  const refreshSpeech = async () => {
    if (speech) {
      await EnjoyApp.speeches.delete(speech.id);
      setSpeech(null);
    }
    findOrCreateSpeech();
  };

  const createSpeech = async (paragraph: { index: number; text: string }) => {
    if (speeching) return;
    const { index, text } = paragraph;

    setSpeeching(true);
    tts({
      sourceId: document.id,
      sourceType: "Document",
      section,
      paragraph: index,
      text,
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
    if (typeof section !== "number" || !paragraph) return;
    findOrCreateSpeech();
    findNextParagraph(paragraph.index + 1);

    return () => {
      setSpeech(null);
      setAudio(null);
    };
  }, [paragraph]);

  useEffect(() => {
    if (!ref.current) return;
    if (!playingParagraph) return;

    findParagraph();

    return () => {
      setParagraph(null);
      ref.current?.querySelectorAll(".playing-paragraph").forEach((el) => {
        el.classList.remove("playing-paragraph", "bg-yellow-100");
      });
    };
  }, [ref, playingParagraph]);

  // Close the player when the section changes
  useEffect(() => {
    return () => {
      togglePlayingParagraph(null);
    };
  }, [section]);

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
      <div className="flex justify-center items-center space-x-4 h-full">
        <Button onClick={findOrCreateSpeech}>{t("textToSpeech")}</Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => togglePlayingParagraph(null)}
        >
          <XIcon className="w-4 h-4" />
        </Button>
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
          onEnded={() => {
            if (nextParagraph) {
              togglePlayingParagraph(nextParagraph.id);
            }
          }}
          className="w-full h-full"
        />
        <div className="flex justify-center space-x-4">
          <Button
            data-tooltip-content={t("refreshSpeech")}
            data-tooltip-place="bottom"
            data-tooltip-id="global-tooltip"
            variant="outline"
            size="icon"
            onClick={refreshSpeech}
          >
            <RefreshCcwIcon className="w-4 h-4" />
          </Button>
          <Button
            data-tooltip-content={t("locateParagraph")}
            data-tooltip-place="bottom"
            data-tooltip-id="global-tooltip"
            variant="outline"
            size="icon"
            onClick={() => locateParagraph(playingParagraph)}
          >
            <LocateFixedIcon className="w-4 h-4" />
          </Button>
          <Button onClick={startShadow}>{t("shadowingExercise")}</Button>
          <Button
            data-tooltip-content={t("close")}
            data-tooltip-place="bottom"
            data-tooltip-id="global-tooltip"
            variant="outline"
            size="icon"
            onClick={() => togglePlayingParagraph(null)}
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex space-x-1 items-center mb-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => togglePlayingParagraph(null)}
        >
          <XIcon className="w-4 h-4" />
        </Button>
        <span className="text-sm line-clamp-1">{audio.name}</span>
      </div>
      <AudioPlayer id={audio.id} md5={audio.md5} />
    </div>
  );
};
