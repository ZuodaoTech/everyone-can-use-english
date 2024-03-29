import { useEffect, useContext, useState } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import {
  MediaLoadingModal,
  MediaCaption,
  MediaPlayerControls,
  MediaTabs,
  MediaCurrentRecording,
  MediaPlayer,
  LoaderSpin,
} from "@renderer/components";
import { useAudio } from "@renderer/hooks";

export const AudioPlayer = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { setMedia, layout } = useContext(MediaPlayerProviderContext);
  const { audio } = useAudio({ id, md5 });

  useEffect(() => {
    if (!audio) return;
    setMedia(audio);
  }, [audio]);

  if (!layout) return <LoaderSpin />;

  return (
    <div data-testid="audio-player">
      <div className={`${layout.upperWrapper} mb-4`}>
        <div className="grid grid-cols-5 xl:grid-cols-3 gap-6 px-6 h-full">
          <div className={`col-span-2 xl:col-span-1 rounded-lg border shadow-lg ${layout.upperWrapper}`}>
            <MediaTabs />
          </div>
          <div className={`col-span-3 xl:col-span-2 ${layout.upperWrapper}`}>
            <MediaCaption />
          </div>
        </div>
      </div>

      <div className={`${layout.lowerWrapper} flex flex-col`}>
        <div className={`${layout.playerWrapper} py-2 px-6`}>
          <MediaCurrentRecording />
        </div>

        <div className={`${layout.playerWrapper} py-2 px-6`}>
          <MediaPlayer />
        </div>

        <div className={`${layout.panelWrapper} w-full bg-background z-10 shadow-xl`}>
          <MediaPlayerControls />
        </div>
      </div>

      <MediaLoadingModal />
    </div>
  );
};
