import { useEffect, useState, useContext } from "react";
import {
  AppSettingsProviderContext,
  DictProviderContext,
  ThemeProviderContext,
} from "@/renderer/context";
import Frame, { useFrame } from "react-frame-component";
import { getExtension } from "@/utils";
import { DictDefinitionNormalizer } from "@renderer/lib/dict";
import { LoaderSpin } from "@renderer/components";
import { t } from "i18next";

const MIME: Record<string, string> = {
  css: "text/css",
  img: "image",
  jpg: "image/jpeg",
  png: "image/png",
  spx: "audio/x-speex",
  wav: "audio/wav",
  mp3: "audio/mp3",
  js: "text/javascript",
};

export function DictLookupResult({
  word,
  onJump,
}: {
  word: string;
  onJump: (v: string) => void;
}) {
  const { colorScheme } = useContext(ThemeProviderContext);
  const initialContent = `<!DOCTYPE html><html class=${colorScheme}><head></head><body></body></html>`;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentDict } = useContext(DictProviderContext);
  const [definition, setDefinition] = useState("");
  const [looking, setLooking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (currentDict && word) {
      lookup();
    }
  }, [currentDict, word]);

  async function lookup() {
    revoke();
    setLooking(true);

    const _word = word.trim().indexOf(" ") > -1 ? word : word.toLowerCase();

    EnjoyApp.dict
      .lookup(_word, currentDict)
      .then((result) => {
        if (!result) {
          setNotFound(true);
        } else {
          setDefinition(result);
        }
      })
      .catch((err) => {
        setError(true);
      })
      .finally(() => {
        setLooking(false);
      });
  }

  function revoke() {
    setNotFound(false);
    setLooking(false);
    setError(false);
  }

  if (looking) {
    return (
      <div className="text-center">
        <LoaderSpin />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm font-serif text-destructive py-2 text-center">
        - {"Lookup Error"} -
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-sm font-serif text-muted-foreground py-2 text-center">
        - {t("noResultsFound")} -
      </div>
    );
  }

  return (
    <Frame
      initialContent={initialContent}
      mountTarget="body"
      className="h-full"
    >
      <DictLookupResultInner text={definition} onJump={onJump} />
    </Frame>
  );
}

export const DictLookupResultInner = ({
  text,
  onJump,
}: {
  text: string;
  onJump: (v: string) => void;
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentDict } = useContext(DictProviderContext);
  const { document: innerDocument } = useFrame();
  const [html, setHtml] = useState("");

  useEffect(() => {
    normalize();

    return () => {
      normalizer.revoke();
    };
  }, [text]);

  useEffect(() => {
    registerAudioHandler();
    registerJumpHandler();
  }, [html]);

  const handleInjectScript = (url: string) => {
    const tag = innerDocument.createElement("script");
    tag.src = url;

    innerDocument.body.appendChild(tag);
    innerDocument.body.removeChild(tag);
  };

  const handleReadResource = async (key: string) => {
    return EnjoyApp.dict.getResource(key, currentDict);
  };

  const normalizer = new DictDefinitionNormalizer({
    onInjectScript: handleInjectScript,
    onReadResource: handleReadResource,
  });

  async function normalize() {
    const html = await normalizer.normalize(text);
    setHtml(html);
  }

  async function handlePlayAudio(audio: Element) {
    const href = audio.getAttribute("data-source");
    const data = await handleReadResource(href);
    const ext: string = getExtension(href, "wav");
    const url = await normalizer.createUrl(MIME[ext] || "audio", data);
    const _audio = new Audio(url);

    _audio.play();
  }

  function handleJump(el: Element) {
    const word = el.getAttribute("data-word");
    onJump(word);
  }

  const registerAudioHandler = () => {
    const audios = innerDocument?.querySelectorAll("[data-type='audio']");
    if (!audios.length) return;

    audios.forEach((audio: Element) => {
      audio.addEventListener("click", () => handlePlayAudio(audio));
    });

    return () => {
      audios.forEach((audio: Element) => {
        audio.removeEventListener("click", () => handlePlayAudio(audio));
      });
    };
  };

  const registerJumpHandler = () => {
    const links = innerDocument?.querySelectorAll("[data-type='jump']");
    if (!links.length) return;

    links.forEach((el: Element) => {
      el.addEventListener("click", () => handleJump(el));
    });

    return () => {
      links.forEach((el: Element) => {
        el.removeEventListener("click", () => handleJump(el));
      });
    };
  };

  return <div dangerouslySetInnerHTML={{ __html: html }}></div>;
};
