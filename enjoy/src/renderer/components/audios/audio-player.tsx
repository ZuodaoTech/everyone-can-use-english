import { useEffect, useContext, useRef } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import {
  MediaLoadingModal,
  MediaCaption,
  MediaPlayerControls,
  MediaTabs,
  MediaCurrentRecording,
  MediaPlayer,
} from "@renderer/components";
import { useAudio } from "@renderer/hooks";

export const AudioPlayer = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { setMedia } = useContext(MediaPlayerProviderContext);
  const { audio } = useAudio({ id, md5 });

  useEffect(() => {
    if (!audio) return;

    setMedia(audio);
  }, [audio]);

  return (
    <div data-testid="audio-player">
      <div className="h-[calc(100vh-37.5rem)] mb-4">
        <div className="grid grid-cols-3 gap-4 px-6 h-full">
          <div className="col-span-1 rounded-lg border shadow-lg h-[calc(100vh-37.5rem)]">
            <MediaTabs />
          </div>
          <div className="col-span-2 h-[calc(100vh-37.5rem)]">
            <MediaCaption />
          </div>
        </div>
      </div>

      <div className="h-[33rem] flex flex-col">
        <div className="h-[13rem] py-2 px-6 mb-4">
          <MediaCurrentRecording />
        </div>

        <div className="w-full h-[13rem] px-6 py-2 mb-4">
          <MediaPlayer />
        </div>

        <div className="w-full bg-background z-10 shadow-xl">
          <MediaPlayerControls />
        </div>
      </div>

      <MediaLoadingModal />
    </div>
  );
};
