import { useEffect, useContext, useRef } from "react";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import { ScrollArea, toast } from "@renderer/components/ui";
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

export const VideoPlayer = (props: { id?: string; md5?: string }) => {
  const { id, md5 } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { media, currentTime, setMedia, setRef } =
    useContext(MediaPlayerProviderContext);
  const ref = useRef(null);

  useEffect(() => {
    const where = id ? { id } : { md5 };
    EnjoyApp.videos.findOne(where).then((video) => {
      if (video) {
        setMedia(video);
      } else {
        toast.error(t("models.video.notFound"));
      }
    });
  }, [id, md5]);

  useEffect(() => {
    setRef(ref);
  }, [ref]);

  return (
    <div data-testid="video-player">
      <div className="">
        <div className="h-[calc(30vh-3.5rem)]">
          <div className="grid grid-cols-3 gap-4 px-6 pb-4 h-full">
            <MediaInfoPanel />
            <MediaRecordings />
            <MediaTranscription />
          </div>
        </div>

        <div className="h-[70vh] flex flex-col">
          <ScrollArea className="flex-1 w-full h-full border-t">
            <MediaCaption />
          </ScrollArea>

          <div className="w-full border-t relative">
            <div ref={ref} />
            <div className="absolute right-2 top-2">
              <span className="text-sm">
                {formatDuration(currentTime || 0)}
              </span>
              <span className="mx-1">/</span>
              <span className="text-sm">
                {formatDuration(media?.duration || 0)}
              </span>
            </div>
          </div>

          <MediaCurrentRecording />

          <div className="w-full border-t">
            <MediaPlayerControls />
          </div>
        </div>

        <MediaLoadingModal />
      </div>
    </div>
  );
};
