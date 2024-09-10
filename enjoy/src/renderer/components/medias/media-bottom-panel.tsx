import {
  MediaCurrentRecording,
  MediaPlayer,
  MediaPlayerControls,
} from "@renderer/components";

export const MediaBottomPanel = (props: { layout?: number[] }) => {
  const { layout } = props;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <MediaCurrentRecording />
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <MediaPlayer layout={layout} />
        </div>
      </div>

      <MediaPlayerControls />
    </div>
  );
};
