import {
  MediaCurrentRecording,
  MediaWaveform,
  MediaPlayerControls,
} from "@renderer/components";

export const MediaBottomPanel = (props: { layout?: number[] }) => {
  const { layout } = props;

  return (
    <div className="flex flex-col h-full py-2">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden px-4 py-2">
          <MediaCurrentRecording />
        </div>
        <div className="flex-1 overflow-hidden px-4 py-2">
          <MediaWaveform layout={layout} />
        </div>
      </div>

      <MediaPlayerControls />
    </div>
  );
};
