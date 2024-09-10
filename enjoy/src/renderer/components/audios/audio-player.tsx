import { useEffect, useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import {
  MediaLoadingModal,
  MediaRightPanel,
  MediaLeftPanel,
  MediaBottomPanel,
} from "@renderer/components";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui";
import { useAudio } from "@renderer/hooks";

export const AudioPlayer = (props: {
  id?: string;
  md5?: string;
  segmentIndex?: number;
}) => {
  const { id, md5, segmentIndex } = props;
  const { media, setMedia, setCurrentSegmentIndex, getCachedSegmentIndex } =
    useContext(MediaPlayerProviderContext);

  const { audio } = useAudio({ id, md5 });

  const updateCurrentSegmentIndex = async () => {
    let index = segmentIndex || (await getCachedSegmentIndex());
    setCurrentSegmentIndex(index);
  };

  useEffect(() => {
    setMedia(audio);
  }, [audio]);

  useEffect(() => {
    if (!media) return;

    updateCurrentSegmentIndex();
    return () => {
      setCurrentSegmentIndex(0);
    };
  }, [media?.id]);

  if (!audio) return null;

  return (
    <>
      <ResizablePanelGroup direction="vertical" data-testid="audio-player">
        <ResizablePanel defaultSize={60} minSize={50}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40} minSize={20}>
              <MediaLeftPanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize={20}>
              <MediaRightPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanel minSize={20}>
          <MediaBottomPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
      <MediaLoadingModal />
    </>
  );
};
