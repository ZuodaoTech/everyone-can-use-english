import {
  MediaCurrentRecording,
  MediaPlayer,
  MediaPlayerControls,
} from "@renderer/components";

export const MediaBottomPanel = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex-1 overflow-hidden">
          <MediaCurrentRecording />
        </div>
        <div className="flex-1 overflow-hidden media-player-wrapper">
          <MediaPlayer />
        </div>
      </div>

      <MediaPlayerControls />
    </div>
  );
};
