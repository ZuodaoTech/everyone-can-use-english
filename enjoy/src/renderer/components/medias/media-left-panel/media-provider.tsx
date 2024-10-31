import { useContext, useEffect, useRef } from "react";
import {
  MediaShadowProviderContext,
  ThemeProviderContext,
} from "@renderer/context";
import {
  MediaPlayer as VidstackMediaPlayer,
  MediaProvider as VidstackMediaProvider,
  isAudioProvider,
  isVideoProvider,
  useMediaRemote,
  TextTrack,
  MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { milisecondsToTimestamp } from "@/utils";
import { toast } from "@renderer/components/ui";
import { cn } from "@renderer/lib/utils";

export const MediaProvider = (props: { className?: string }) => {
  const { className } = props;
  const { theme } = useContext(ThemeProviderContext);
  const { media, setMediaProvider, setDecodeError, transcription } = useContext(
    MediaShadowProviderContext
  );
  const mediaRemote = useMediaRemote();
  const player = useRef<MediaPlayerInstance>(null);

  useEffect(() => {
    if (!transcription?.result?.timeline) return;
    if (!player?.current) return;

    const srt = transcription.result.timeline
      .map(
        (t: TimelineEntry) =>
          `1\n${milisecondsToTimestamp(
            t.startTime * 1000
          )} --> ${milisecondsToTimestamp(t.endTime * 1000)}\n${t.text}`
      )
      .join("\n\n");

    player.current.textTracks.clear();
    player.current.textTracks.add(
      new TextTrack({
        label: "Transcription",
        content: srt,
        kind: "subtitles",
        type: "srt",
        language: transcription.result.language,
      })
    );
  }, [player, transcription]);

  useEffect(() => {
    return () => {
      setMediaProvider(null);
    };
  }, [media?.src]);

  if (!media?.src) return null;

  return (
    <div className={cn("px-2 py-4", className)}>
      <VidstackMediaPlayer
        ref={player}
        className="my-auto"
        src={media.src}
        onCanPlayThrough={(detail, nativeEvent) => {
          mediaRemote.setTarget(nativeEvent.target);
          const { provider } = detail;
          if (isAudioProvider(provider)) {
            setMediaProvider(provider.audio);
          } else if (isVideoProvider(provider)) {
            setMediaProvider(provider.video);
          }
        }}
        onError={(err) => {
          toast.error(err.message);
          setDecodeError(err.message);
        }}
      >
        <VidstackMediaProvider />
        <DefaultAudioLayout icons={defaultLayoutIcons} colorScheme={theme} />
        <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme={theme} />
      </VidstackMediaPlayer>
    </div>
  );
};
