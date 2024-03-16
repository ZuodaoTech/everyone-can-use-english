import { useEffect, useContext, useRef } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import {
  MediaLoadingModal,
  MediaCaption,
  MediaPlayerControls,
  MediaTabs,
  MediaCurrentRecording,
} from "@renderer/components";
import { formatDuration } from "@renderer/lib/utils";
import { useVideo } from "@renderer/hooks";

export const VideoPlayer = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { media, currentTime, setMedia, setRef } = useContext(
    MediaPlayerProviderContext
  );
  const { video } = useVideo({ id, md5 });
  const ref = useRef(null);

  useEffect(() => {
    if (!video) return;

    setMedia(video);
  }, [video]);

  useEffect(() => {
    setRef(ref);
  }, [ref]);

  return (
    <div data-testid="video-player">
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
          <div className="border rounded-xl shadow-lg relative">
            <div data-testid="media-player-container" ref={ref} />
            <div className="absolute right-2 top-1">
              <span className="text-sm">
                {formatDuration(currentTime || 0)}
              </span>
              <span className="mx-1">/</span>
              <span className="text-sm">
                {formatDuration(media?.duration || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full bg-background z-10 shadow-xl">
          <MediaPlayerControls />
        </div>
      </div>

      <MediaLoadingModal />
    </div>
  );
};
