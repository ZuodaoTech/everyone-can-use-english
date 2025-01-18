import { useEffect, useState, useContext } from "react";
import { DictProviderContext, ThemeProviderContext } from "@/renderer/context";
import Frame, { useFrame } from "react-frame-component";
import { getExtension } from "@/utils";
import { DictDefinitionNormalizer } from "@renderer/lib/dict";
import { LoaderSpin } from "@renderer/components";
import { t } from "i18next";
import debounce from "lodash/debounce";

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
  autoHeight,
  onJump,
}: {
  word: string;
  autoHeight?: boolean;
  onJump?: (v: string) => void;
}) {
  const { colorScheme } = useContext(ThemeProviderContext);
  const initialContent = `<!DOCTYPE html><html class=${colorScheme}><head></head><body></body></html>`;
  const { currentDict, lookup } = useContext(DictProviderContext);
  const [definition, setDefinition] = useState("");
  const [looking, setLooking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    if (currentDict && word) {
      handleLookup();
    }
  }, [currentDict, word]);

  async function handleLookup() {
    revoke();
    setLooking(true);

    if (autoHeight) {
      setHeight(0);
    }

    const _word = word.trim().indexOf(" ") > -1 ? word : word.toLowerCase();

    lookup(_word, currentDict)
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

  function handleResize(h: number) {
    setHeight(h);
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
      style={{ minHeight: autoHeight ? `${height}px` : "100%" }}
    >
      <DictLookupResultInner
        text={definition}
        onJump={onJump}
        autoHeight={autoHeight}
        onResize={handleResize}
      />
    </Frame>
  );
}

export const DictLookupResultInner = ({
  text,
  onJump,
  onResize,
  autoHeight,
}: {
  text: string;
  autoHeight: boolean;
  onJump?: (v: string) => void;
  onResize?: (v: number) => void;
}) => {
  const { currentDict, getResource } = useContext(DictProviderContext);
  const { document: innerDocument } = useFrame();
  const [html, setHtml] = useState("");
  const [hash, setHash] = useState("");

  const debouncedResize = debounce(onResize, 100);

  useEffect(() => {
    if (autoHeight) {
      let rafId: number;
      const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const html = innerDocument.getElementsByTagName("html")[0];
          debouncedResize(html.scrollHeight);
        });
      });

      resizeObserver.observe(innerDocument.getElementById("inner-dict"));

      return () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(rafId);
      };
    }
  }, []);

  useEffect(() => {
    normalize().then(() => {
      if (hash) {
        handleScroll();
        setHash("");
      }
    });

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
    return getResource(key, currentDict);
  };

  const normalizer = new DictDefinitionNormalizer({
    onInjectScript: handleInjectScript,
    onReadResource: handleReadResource,
  });

  async function normalize() {
    const html = await normalizer.normalize(text);
    setHtml(html);
  }

  async function handlePlayAudio(e: Event, audio: Element) {
    e.preventDefault();
    const href = audio.getAttribute("data-source");
    const data = await handleReadResource(href);
    const ext: string = getExtension(href, "wav");
    const url = await normalizer.createUrl(MIME[ext] || "audio", data);
    const _audio = new Audio(url);

    _audio.play();
  }

  function handleJump(e: Event, el: Element) {
    e.preventDefault();
    const word = el.getAttribute("data-word");
    const hash = el.getAttribute("data-hash");
    onJump?.(word);
    setHash(hash);
  }

  function handleScroll() {
    setTimeout(() => {
      const el = innerDocument.querySelector(`a[name='${hash}']`);
      if (el) {
        el.scrollIntoView();
      }
    }, 200);
  }

  const registerAudioHandler = () => {
    const audios = innerDocument?.querySelectorAll("[data-type='audio']");
    if (!audios.length) return;

    audios.forEach((audio: Element) => {
      audio.addEventListener("click", (e) => handlePlayAudio(e, audio));
    });

    return () => {
      audios.forEach((audio: Element) => {
        audio.removeEventListener("click", (e) => handlePlayAudio(e, audio));
      });
    };
  };

  const registerJumpHandler = () => {
    const links = innerDocument?.querySelectorAll("[data-type='jump']");
    if (!links.length) return;

    links.forEach((el: Element) => {
      el.addEventListener("click", (e) => handleJump(e, el));
    });

    return () => {
      links.forEach((el: Element) => {
        el.removeEventListener("click", (e) => handleJump(e, el));
      });
    };
  };

  return <div id="inner-dict" dangerouslySetInnerHTML={{ __html: html }}></div>;
};
