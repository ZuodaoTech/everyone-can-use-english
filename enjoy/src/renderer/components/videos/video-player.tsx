import { useEffect, useContext } from "react";
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
import { useVideo } from "@renderer/hooks";

export const VideoPlayer = (props: {
  id?: string;
  md5?: string;
  segmentIndex?: number;
}) => {
  const { id, md5, segmentIndex } = props;
  const { setMedia, layout, setCurrentSegmentIndex } = useContext(
    MediaPlayerProviderContext
  );
  const { video } = useVideo({ id, md5 });

  useEffect(() => {
    if (!video) return;

    setMedia(video);
  }, [video]);

  useEffect(() => {
    if (!segmentIndex) return;
    setCurrentSegmentIndex(segmentIndex);
  }, []);

  if (!layout) return <LoaderSpin />;

  return (
    <div data-testid="video-player" className={layout.wrapper}>
      <div className={`${layout.upperWrapper} mb-4`}>
        <div className="grid grid-cols-5 xl:grid-cols-3 gap-3 xl:gap-6 px-6 h-full">
          <div
            className={`col-span-2 xl:col-span-1 rounded-lg border shadow-lg ${layout.upperWrapper}`}
          >
            <MediaTabs />
          </div>
          <div className={`col-span-3 xl:col-span-2 ${layout.upperWrapper}`}>
            <MediaCaption />
          </div>
        </div>
      </div>

      <div className={`${layout.lowerWrapper} flex flex-col`}>
        <div className={`${layout.playerWrapper} py-2 px-3 xl:px-6`}>
          <MediaCurrentRecording />
        </div>

        <div className={`${layout.playerWrapper} py-2 px-3 xl:px-6`}>
          <MediaPlayer />
        </div>

        <div className={`${layout.panelWrapper} bg-background shadow-xl`}>
          <MediaPlayerControls />
        </div>
      </div>

      <MediaLoadingModal />
    </div>
  );
};
