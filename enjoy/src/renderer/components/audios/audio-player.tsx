import { useEffect, useContext, useRef } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import { ScrollArea } from "@renderer/components/ui";
import {
  MediaLoadingModal,
  MediaCaption,
  MediaTranscription,
  MediaPlayerControls,
  MediaInfoPanel,
  MediaRecordings,
  MediaCurrentRecording,
} from "@renderer/components";
import { formatDuration } from "@renderer/lib/utils";
import { useAudio } from "@renderer/hooks";

export const AudioPlayer = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { media, currentTime, setMedia, setRef } = useContext(
    MediaPlayerProviderContext
  );
  const { audio } = useAudio({ id, md5 });
  const ref = useRef(null);

  useEffect(() => {
    if (!audio) return;

    setMedia(audio);
  }, [audio]);

  useEffect(() => {
    setRef(ref);
  }, [ref]);

  return (
    <div data-testid="audio-player">
      <div className="">
        <div className="h-[calc(30vh-3.5rem)]">
          <div className="grid grid-cols-3 gap-4 px-6 h-full">
            <MediaInfoPanel />
            <MediaRecordings />
            <MediaTranscription />
          </div>
        </div>

        <div className="h-[70vh] flex flex-col">
          <ScrollArea className="h-[calc(70vh-19rem)] px-6">
            <MediaCaption />

            <div className="sticky bottom-0 z-10 bg-background">
              <MediaCurrentRecording />
            </div>
          </ScrollArea>

          <div className="w-full h-[13rem] px-6 py-2 my-2">
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
    </div>
  );
};
