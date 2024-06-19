import {
  MediaPlayer,
  MediaProvider,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const UniversalPlayer = (props: {
  src: string;
  onTimeUpdate?: (time: number) => void;
  onError?: (error: any) => void;
}) => {
  const { src, onTimeUpdate, onError } = props;
  const mediaPlayer = useRef<MediaPlayerInstance>(null);
  const [uuid] = useState<string>(uuidv4());

  useEffect(() => {
    if (!mediaPlayer.current) return;

    const onOtherPlayerPlay = (event: CustomEvent) => {
      if (event.detail.uuid !== uuid) {
        mediaPlayer.current!.pause();
      }
    };

    document.addEventListener("play", onOtherPlayerPlay);

    return () => {
      document.removeEventListener("play", onOtherPlayerPlay);
    };
  }, [uuid, mediaPlayer.current]);

  return (
    <MediaPlayer
      ref={mediaPlayer}
      onTimeUpdate={({ currentTime }) => {
        onTimeUpdate(currentTime);
      }}
      src={src}
      onError={(err) => onError(err)}
      onPlay={() => {
        const event = new CustomEvent("play", {
          detail: { uuid },
        });
        document.dispatchEvent(event);
      }}
    >
      <MediaProvider />
      <DefaultAudioLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
};
