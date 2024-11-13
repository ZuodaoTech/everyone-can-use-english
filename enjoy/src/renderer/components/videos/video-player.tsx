import { useEffect, useContext } from "react";
import { MediaShadowProviderContext } from "@renderer/context";
import { MediaShadowPlayer } from "@renderer/components";

import { useVideo } from "@renderer/hooks";

export const VideoPlayer = (props: {
  id?: string;
  md5?: string;
  segmentIndex?: number;
  onLoad?: (video: VideoType) => void;
}) => {
  const { id, md5, segmentIndex, onLoad } = props;
  const { media, setMedia, setCurrentSegmentIndex, getCachedSegmentIndex } =
    useContext(MediaShadowProviderContext);
  const { video } = useVideo({ id, md5 });

  const updateCurrentSegmentIndex = async () => {
    let index = segmentIndex || (await getCachedSegmentIndex());
    setCurrentSegmentIndex(index);
  };

  useEffect(() => {
    setMedia(video);
    onLoad?.(video);
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
    <div className="h-full" data-testid="video-player">
      <MediaShadowPlayer />
    </div>
  );
};
