import { useState, useEffect } from "react";
import { cn } from "@renderer/lib/utils";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@renderer/components/ui";
import { LookupResult } from "@renderer/components";
import { LanguagesIcon, PlayIcon } from "lucide-react";

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
      <div className="flex flex-wrap">
        {(transcription.segments || []).map((w, index) => (
          <span
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
            {w.text}
          </span>
        ))}

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
