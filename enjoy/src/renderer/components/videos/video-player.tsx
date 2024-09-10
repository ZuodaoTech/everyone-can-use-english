import { useEffect, useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import {
  MediaLoadingModal,
  MediaCaptionPanel,
  MediaPlayerControls,
  MediaTabs,
  MediaCurrentRecording,
  MediaPlayer,
  LoaderSpin,
} from "@renderer/components";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui";

import { useVideo } from "@renderer/hooks";

export const VideoPlayer = (props: {
  id?: string;
  md5?: string;
  segmentIndex?: number;
}) => {
  const { id, md5, segmentIndex } = props;
  const { media, setMedia, setCurrentSegmentIndex, getCachedSegmentIndex } =
    useContext(MediaPlayerProviderContext);
  const { video } = useVideo({ id, md5 });

  const updateCurrentSegmentIndex = async () => {
    let index = segmentIndex || (await getCachedSegmentIndex());
    setCurrentSegmentIndex(index);
  };

  useEffect(() => {
    setMedia(video);
  }, [video]);

  useEffect(() => {
    if (!media) return;
    updateCurrentSegmentIndex();

    return () => {
      setCurrentSegmentIndex(0);
    };
  }, [media]);

  if (!video) return null;

  return (
    <>
      <ResizablePanelGroup direction="vertical" data-testid="video-player">
        <ResizablePanel defaultSize={60} minSize={50}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40} minSize={20}>
              <MediaTabs />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize={20}>
              <MediaCaptionPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanel minSize={20}>
          <div className="flex flex-col h-full">
            <div className="flex-1 grid grid-rows-2 gap-4">
              <MediaCurrentRecording />
              <MediaPlayer />
            </div>

            <MediaPlayerControls />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <MediaLoadingModal />
    </>
  );
};
