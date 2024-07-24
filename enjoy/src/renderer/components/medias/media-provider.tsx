import { useContext, useEffect, useRef } from "react";
import {
  MediaPlayerProviderContext,
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

export const MediaProvider = () => {
  const { theme } = useContext(ThemeProviderContext);
  const { media, setMediaProvider, setDecodeError, transcription } = useContext(
    MediaPlayerProviderContext
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

    return () => {
      setMediaProvider(null);
    };
  }, [player, transcription]);

  if (!media?.src) return null;

  return (
    <div className="px-2 py-4" data-testid="media-player">
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
        onError={(err) => setDecodeError(err.message)}
      >
        <VidstackMediaProvider />
        <DefaultAudioLayout icons={defaultLayoutIcons} colorScheme={theme} />
        <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme={theme} />
      </VidstackMediaPlayer>
    </div>
  );
};
