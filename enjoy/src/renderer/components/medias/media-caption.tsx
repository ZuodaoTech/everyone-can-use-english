import { useState, useEffect, useContext } from "react";
import { cn } from "@renderer/lib/utils";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverAnchor,
  toast,
} from "@renderer/components/ui";
import { LookupResult } from "@renderer/components";
import {
  ChevronDownIcon,
  LanguagesIcon,
  PlayIcon,
  LoaderIcon,
  SpeechIcon,
} from "lucide-react";
import { translateCommand, ipaCommand } from "@commands";
import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import { md5 } from "js-md5";

export const MediaCaption = (props: {
  mediaId: string;
  mediaType: string;
  currentTime: number;
  transcription: TranscriptionResultSegmentGroupType;
  onSeek?: (time: number) => void;
  className?: string;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}) => {
  const {
    transcription,
    currentTime,
    onSeek,
    className,
    isPlaying,
    setIsPlaying,
  } = props;
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selected, setSelected] = useState<{
    index: number;
    word: string;
    position?: {
      top: number;
      left: number;
    };
  }>();
  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);
  const [displayTranslation, setDisplayTranslation] = useState<boolean>(false);

  const [ipa, setIpa] = useState<{ word?: string; ipa?: string }[]>([]);
  const [ipaGenerating, setIpaGenerating] = useState<boolean>(false);
  const [displayIpa, setDisplayIpa] = useState<boolean>(false);

  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);

  const toogleIPA = async () => {
    if (ipaGenerating) return;

    if (ipa.length > 0) {
      setDisplayIpa(!displayIpa);
      return;
    }

    const hash = md5.create();
    hash.update(transcription.text);
    const cacheKey = `ipa-${hash.hex()}`;
    const cached = await EnjoyApp.cacheObjects.get(cacheKey);
    if (cached) {
      setIpa(cached);
      return;
    }

    if (!openai?.key) {
      toast.error(t("openaiApiKeyRequired"));
      return;
    }
    setIpaGenerating(true);

    ipaCommand(transcription.text, {
      key: openai.key,
      modelName: openai.model,
      baseUrl: openai.baseUrl,
    })
      .then((result) => {
        if (result?.words?.length > 0) {
          setIpa(result.words);
          EnjoyApp.cacheObjects.set(cacheKey, result.words);
          setDisplayIpa(true);
        }
      })
      .finally(() => {
        setIpaGenerating(false);
      });
  };

  const translate = async () => {
    if (translating) return;

    if (translation) {
      setDisplayTranslation(!displayTranslation);
      return;
    }

    const hash = md5.create();
    hash.update(transcription.text);
    const cacheKey = `translate-${hash.hex()}`;
    const cached = await EnjoyApp.cacheObjects.get(cacheKey);
    if (cached) {
      setTranslation(cached);
      return;
    }

    if (!openai?.key) {
      toast.error(t("openaiApiKeyRequired"));
      return;
    }
    setTranslating(true);

    translateCommand(transcription.text, {
      key: openai.key,
      modelName: openai.model,
      baseUrl: openai.baseUrl,
    })
      .then((result) => {
        if (result) {
          setTranslation(result);
          EnjoyApp.cacheObjects.set(cacheKey, result);
          setDisplayTranslation(true);
        }
      })
      .finally(() => {
        setTranslating(false);
      });
  };

  useEffect(() => {
    if (!transcription) return;
    const time = Math.round(currentTime * 1000);
    const index = transcription.segments.findIndex(
      (w) => time >= w.offsets.from && time < w.offsets.to
    );

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [currentTime, transcription]);

  if (!transcription) return null;
  if (Math.round(currentTime * 1000) < transcription.offsets.from) return null;

  return (
    <div className={cn("relative px-4 py-2 text-lg", className)}>
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          <div className="flex flex-wrap">
            {(transcription.segments || []).map((w, index) => (
              <div
                key={index}
                className={`mr-1 cursor-pointer hover:bg-red-500/10 ${
                  index === activeIndex ? "text-red-500" : ""
                }`}
                onClick={(event) => {
                  setSelected({
                    index,
                    word: w.text,
                    position: {
                      top:
                        event.currentTarget.offsetTop +
                        event.currentTarget.offsetHeight,
                      left: event.currentTarget.offsetLeft,
                    },
                  });

                  setIsPlaying(false);
                  if (onSeek) onSeek(w.offsets.from / 1000);
                }}
              >
                <div>{w.text}</div>
                {displayIpa &&
                  ipa.find(
                    (i) =>
                      i.word.trim() === w.text.replace(/[\.,?!]/g, "").trim()
                  )?.ipa && (
                    <div className="text-sm text-foreground/70 font-serif">
                      {
                        ipa.find(
                          (i) =>
                            i.word.trim() ===
                            w.text.replace(/[\.,?!]/g, "").trim()
                        )?.ipa
                      }
                    </div>
                  )}
              </div>
            ))}
          </div>
          {displayTranslation && translation && (
            <div className="select-text py-2 text-sm text-foreground/70">
              {translation}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChevronDownIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer capitalize"
              disabled={translating}
              onClick={translate}
            >
              {translating ? (
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LanguagesIcon className="w-4 h-4 mr-2" />
              )}
              <span>{t("translate")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer capitalize"
              disabled={ipaGenerating}
              onClick={toogleIPA}
            >
              {ipaGenerating ? (
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <SpeechIcon className="w-4 h-4 mr-2" />
              )}
              <span>{t("displayIpa")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Popover
        open={Boolean(selected) && !isPlaying}
        onOpenChange={(value) => {
          if (!value) setSelected(null);
        }}
      >
        <PopoverAnchor
          className="absolute w-0 h-0"
          style={{
            top: selected?.position?.top,
            left: selected?.position?.left,
          }}
        ></PopoverAnchor>
        <PopoverContent
          className="w-full max-w-md p-0"
          updatePositionStrategy="always"
        >
          {selected?.word && (
            <ResourceCaptionSelectionMenu
              word={selected.word}
              context={transcription.segments
                .map((w) => w.text)
                .join(" ")
                .trim()}
              mediaId={props.mediaId}
              mediaType={props.mediaType}
              onPlay={() => {
                setIsPlaying(true);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

const ResourceCaptionSelectionMenu = (props: {
  word: string;
  context: string;
  mediaId: string;
  mediaType: string;
  onPlay: () => void;
}) => {
  const { word, context, mediaId, mediaType, onPlay } = props;
  const [translating, setTranslating] = useState<boolean>(false);

  if (!word) return null;

  if (translating) {
    return (
      <LookupResult
        word={word}
        context={context}
        sourceId={mediaId}
        sourceType={mediaType}
      />
    );
  }

  return (
    <div className="flex items-center p-1">
      <Button onClick={onPlay} variant="ghost" size="icon">
        <PlayIcon size={16} />
      </Button>
      <Button onClick={() => setTranslating(true)} variant="ghost" size="icon">
        <LanguagesIcon size={16} />
      </Button>
    </div>
  );
};
