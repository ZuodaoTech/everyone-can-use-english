import {
  MediaCurrentRecording,
  MediaWaveform,
  MediaPlayerControls,
} from "@renderer/components";

export const MediaBottomPanel = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col pt-2 overflow-hidden">
        <div className="flex-1 overflow-hidden px-4 py-2">
          <MediaCurrentRecording />
        </div>
        <div className="flex-1 overflow-hidden px-4 py-2">
          <MediaWaveform />
        </div>
      </div>

      <MediaPlayerControls />
    </div>
  );
};
