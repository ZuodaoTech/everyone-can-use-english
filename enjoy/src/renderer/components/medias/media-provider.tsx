import { useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import {
  MediaPlayer as VidstackMediaPlayer,
  MediaProvider as VidstackMediaProvider,
  isAudioProvider,
  isVideoProvider,
  useMediaRemote,
} from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

export const MediaProvider = () => {
  const { media, setMediaProvider, setDecodeError } = useContext(
    MediaPlayerProviderContext
  );
  const mediaRemote = useMediaRemote();
  if (!media?.src) return null;

  return (
    <div className="px-2 py-4" data-testid="media-player">
      <VidstackMediaPlayer
        className="my-auto"
        controls
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
        <DefaultAudioLayout icons={defaultLayoutIcons} />
      </VidstackMediaPlayer>
    </div>
  );
};
