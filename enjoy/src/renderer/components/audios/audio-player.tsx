import { useEffect, useContext } from "react";
import { MediaShadowProviderContext } from "@renderer/context";
import { useAudio } from "@renderer/hooks";
import { MediaShadowPlayer } from "@renderer/components";

export const AudioPlayer = (props: {
  id?: string;
  md5?: string;
  segmentIndex?: number;
  onLoad?: (audio: AudioType) => void;
}) => {
  const { id, md5, segmentIndex, onLoad } = props;
  const { media, setMedia, setCurrentSegmentIndex, getCachedSegmentIndex } =
    useContext(MediaShadowProviderContext);

  const { audio } = useAudio({ id, md5 });

  const updateCurrentSegmentIndex = async () => {
    let index = segmentIndex || (await getCachedSegmentIndex());
    setCurrentSegmentIndex(index);
  };

  useEffect(() => {
    setMedia(audio);
    onLoad?.(audio);
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
    <div className="h-full" data-testid="audio-player">
      <MediaShadowPlayer />
    </div>
  );
};
