import { useEffect, useContext, useRef } from "react";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import { ScrollArea, toast } from "@renderer/components/ui";
import {
  MediaLoadingModal,
  AudioCaption,
  AudioTranscription,
  AudioPlayerControls,
  AudioInfoPanel,
  AudioRecordings,
  AudioCurrentRecording,
} from "@renderer/components";
import {
  MediaPlayer as VidstackMediaPlayer,
  MediaProvider,
  isAudioProvider,
  isVideoProvider,
  useMediaRemote,
} from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { formatDuration } from "@renderer/lib/utils";

export const AudioPlayer = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { media, currentTime, setMedia, setMediaProvider, decoded, setRef } =
    useContext(MediaPlayerProviderContext);
  const ref = useRef(null);

  const mediaRemote = useMediaRemote();

  useEffect(() => {
    const where = id ? { id } : { md5 };
    EnjoyApp.audios.findOne(where).then((audio) => {
      if (audio) {
        setMedia(audio);
      } else {
        toast.error(t("models.audio.notFound"));
      }
    });
  }, [id, md5]);

  useEffect(() => {
    setRef(ref);
  }, [ref]);

  return (
    <div data-testid="audio-player">
      <div className="">
        <div className="h-[calc(30vh-3.5rem)]">
          {media?.src && (
            <div className={decoded ? "hidden" : ""}>
              <VidstackMediaPlayer
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
              >
                <MediaProvider />
                <DefaultAudioLayout icons={defaultLayoutIcons} />
              </VidstackMediaPlayer>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 px-6 pb-4 h-full">
            <AudioInfoPanel />
            <AudioRecordings />
            <AudioTranscription />
          </div>
        </div>

        <div className="h-[70vh] flex flex-col">
          <ScrollArea className="flex-1 w-full h-full border-t">
            <AudioCaption />
          </ScrollArea>

          <div className="w-full border-t relative">
            <div ref={ref} />
            <div className="absolute right-2 top-2">
              <span className="text-sm">{formatDuration(currentTime || 0)}</span>
              <span className="mx-1">/</span>
              <span className="text-sm">
                {formatDuration(media?.duration || 0)}
              </span>
            </div>
          </div>

          <AudioCurrentRecording />

          <div className="w-full border-t">
            <AudioPlayerControls />
          </div>
        </div>

        <MediaLoadingModal />
      </div>
    </div>
  );
};
