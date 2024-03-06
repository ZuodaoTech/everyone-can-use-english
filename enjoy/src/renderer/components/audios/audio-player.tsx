import { createContext, useEffect, useState, useContext, useRef } from "react";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import { Button, toast } from "@renderer/components/ui";
import {
  MediaLoadingModal,
  AudioCaption,
  AudioTranscription,
  AudioPlayerControls,
  AudioInfoPanel,
  AudioRecordings,
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

export const AudioPlayer = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { media, setMedia, setMediaProvider, decoded, setRef, wavesurfer } =
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
        <div className="h-[calc(40vh-3.5rem)]">
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

        <div className="h-[60vh] flex flex-col">
          <div className="flex-1 w-full p-4 h-48 border-t">
            <AudioCaption />
          </div>
          <div className="w-full border-t">
            <div ref={ref} />
          </div>
          <AudioPlayerControls />
        </div>

        <MediaLoadingModal />
      </div>
    </div>
  );
};
