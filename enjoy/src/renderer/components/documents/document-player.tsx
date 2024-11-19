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
  LoaderIcon,
  LocateFixedIcon,
  RefreshCcwIcon,
  XIcon,
} from "lucide-react";

export const DocumentPlayer = () => {
  const {
    ref,
    document,
    section,
    togglePlayingSegment,
    locateSegment,
    playingSegment,
    nextSegment,
  } = useContext(DocumentProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [speech, setSpeech] = useState<SpeechType | null>(null);
  const [speeching, setSpeeching] = useState(false);
  const [resourcing, setResourcing] = useState(false);
  const { tts } = useSpeech();
  const [audio, setAudio] = useState<AudioType | null>(null);

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
          name: `[S${section}P${playingSegment.index}]-${document.title}`,
          originalText: speech.text,
        })
        .then((audio) => setAudio(audio))
        .catch((err) => toast.error(err.message))
        .finally(() => setResourcing(false));
    }
  };

  const findOrCreateSpeech = async () => {
    if (typeof section !== "number" || !playingSegment) return;

    const existingSpeech = await EnjoyApp.speeches.findOne({
      sourceId: document.id,
      sourceType: "Document",
      section,
      segment: playingSegment.index,
    });

    if (existingSpeech) {
      setSpeech(existingSpeech);
    } else {
      createSpeech(playingSegment);
    }
  };

  const refreshSpeech = async () => {
    if (speech) {
      await EnjoyApp.speeches.delete(speech.id);
      setSpeech(null);
    }
    findOrCreateSpeech();
  };

  const createSpeech = async (segment: { index: number; text: string }) => {
    if (speeching) return;
    const { index, text } = segment;

    setSpeeching(true);
    tts({
      sourceId: document.id,
      sourceType: "Document",
      section,
      segment: index,
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
    if (typeof section !== "number" || !playingSegment) return;
    findOrCreateSpeech();

    return () => {
      setSpeech(null);
      setAudio(null);
    };
  }, [playingSegment]);

  // Close the player when the section changes
  useEffect(() => {
    return () => {
      togglePlayingSegment(null);
    };
  }, [section]);

  if (typeof section !== "number" || !playingSegment) {
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
          onClick={() => togglePlayingSegment(null)}
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
            if (nextSegment) {
              togglePlayingSegment(nextSegment.id);
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
            onClick={() => {
              const el = locateSegment(playingSegment.id);
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              }
            }}
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
            onClick={() => togglePlayingSegment(null)}
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
          onClick={() => togglePlayingSegment(null)}
        >
          <XIcon className="w-4 h-4" />
        </Button>
        <span className="text-sm line-clamp-1">{audio.name}</span>
      </div>
      <AudioPlayer id={audio.id} md5={audio.md5} />
    </div>
  );
};
