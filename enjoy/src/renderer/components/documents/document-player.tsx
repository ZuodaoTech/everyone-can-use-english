import { AppSettingsProviderContext } from "@renderer/context";
import { useSpeech } from "@renderer/hooks";
import { useContext, useEffect, useState } from "react";
import { Button, toast } from "@renderer/components/ui";
import { AudioPlayer, LoaderSpin } from "@renderer/components";
import { t } from "i18next";

export const DocumentPlayer = (props: {
  document: DocumentEType;
  section: number;
  paragraph: number;
  text: string;
}) => {
  const { document, section, paragraph, text } = props;
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
          name: `[S${section}P${paragraph}]-${document.title}`,
          originalText: speech.text,
        })
        .then((audio) => setAudio(audio))
        .catch((err) => toast.error(err.message))
        .finally(() => setResourcing(false));
    }
  };

  const findOrCreateSpeech = () => {
    EnjoyApp.speeches
      .findOne({
        sourceId: document.id,
        sourceType: "Document",
        section,
        paragraph,
      })
      .then((speech) => {
        if (speech) {
          setSpeech(speech);
        } else {
          createSpeech();
        }
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const createSpeech = async () => {
    if (speech) return;
    if (speeching) return;

    setSpeeching(true);
    tts({
      sourceId: document.id,
      sourceType: "Document",
      section,
      paragraph,
      text,
      configuration: {
        engine: "enjoyai",
        model: "tts-1",
        voice: "shimmer",
      },
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
  }, [document.id, section, paragraph]);

  useEffect(() => {
    if (!speech) return;

    startShadow();
  }, [speech]);

  if (speeching || resourcing) {
    return <LoaderSpin />;
  }

  if (!speech) {
    return (
      <div className="flex justify-center items-center h-full">
        <Button onClick={createSpeech}>{t("retry")}</Button>
      </div>
    );
  }

  if (!audio) {
    return (
      <div className="flex justify-center items-center h-full">
        <Button onClick={startShadow}>{t("retry")}</Button>
      </div>
    );
  }

  return <AudioPlayer id={audio.id} md5={audio.md5} />;
};
