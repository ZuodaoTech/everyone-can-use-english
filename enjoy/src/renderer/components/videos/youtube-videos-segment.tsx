import { t } from "i18next";
import { useState, useEffect, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  Button,
  ScrollArea,
  ScrollBar,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Progress,
} from "@renderer/components/ui";
import { useNavigate } from "react-router-dom";
import { LoaderIcon } from "lucide-react";

export const YoutubeVideosSegment = (props: { channel: string }) => {
  const { channel } = props;
  const navigate = useNavigate();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [videos, setvideos] = useState<YoutubeVideoType[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideoType | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(null);

  const addToLibrary = () => {
    let url = `https://www.youtube.com/watch?v=${selectedVideo?.videoId}`;
    setSubmitting(true);
    setProgress(0);

    EnjoyApp.videos
      .create(url, {
        name: selectedVideo?.title,
      })
      .then((record) => {
        if (!record) return;

        navigate(`/videos/${record.id}`);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const fetchYoutubeVideos = async () => {
    const cachedVideos = await EnjoyApp.cacheObjects.get(
      `youtube-videos-${channel}`
    );
    if (cachedVideos) {
      setvideos(cachedVideos);
      return;
    }

    EnjoyApp.providers.youtube
      .videos(channel)
      .then((videos) => {
        if (!videos) return;

        EnjoyApp.cacheObjects.set(`youtube-videos-${channel}`, videos, 60 * 10);
        setvideos(videos);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    fetchYoutubeVideos();
  }, []);

  useEffect(() => {
    EnjoyApp.download.onState((_, downloadState) => {
      const { state, received, speed } = downloadState;
      if (state === "progressing") {
        setProgress(received);
        setDownloadSpeed(speed);
      }
    });

    return () => {
      EnjoyApp.download.removeAllListeners();
    };
  }, [submitting]);

  if (!videos?.length) return null;

  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {t("from")} Youtube {channel}
          </h2>
        </div>
        <div className="ml-auto mr-4"></div>
      </div>
      <ScrollArea>
        <div className="flex items-center space-x-4 pb-4">
          {videos.map((video) => {
            return (
              <YoutubeVideoCard
                key={video.videoId}
                video={video}
                onClick={() => setSelectedVideo(video)}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Dialog
        open={Boolean(selectedVideo)}
        onOpenChange={(value) => {
          if (!value) setSelectedVideo(null);
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("downloadVideo")}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center mb-4 bg-muted rounded-lg">
            <div className="aspect-square h-28 overflow-hidden rounded-l-lg">
              <img
                src={selectedVideo?.thumbnail}
                alt={selectedVideo?.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 py-3 px-4 h-28">
              <div className="text-lg font-semibold ">
                {selectedVideo?.title}
              </div>
              <div className="text-xs line-clamp-1 mb-2 text-right">
                {selectedVideo?.duration}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                EnjoyApp.shell.openExternal(
                  `https://www.youtube.com/watch?v=${selectedVideo?.videoId}`
                )
              }
              className="mr-auto"
            >
              {t("open")}
            </Button>

            <Button onClick={() => setSelectedVideo(null)} variant="secondary">
              {t("cancel")}
            </Button>

            <Button onClick={() => addToLibrary()} disabled={submitting}>
              {submitting && (
                <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
              )}
              {submitting
                ? progress < 100
                  ? t("downloading")
                  : t("importing")
                : t("downloadVideo")}
            </Button>
          </DialogFooter>
          {submitting && (
            <div>
              <Progress value={progress} className="mb-2" />
              <div className="text-xs line-clamp-1 mb-2 text-right">
                {downloadSpeed}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const YoutubeVideoCard = (props: {
  video: YoutubeVideoType;
  onClick?: () => void;
}) => {
  const { video, onClick } = props;

  return (
    <div onClick={onClick} className="w-64 cursor-pointer">
      <div className="aspect-[16/9] border rounded-lg overflow-hidden relative mb-4">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="hover:scale-105 object-cover w-full h-full"
        />

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50">
          <div className="text-xs text-white text-right">{video.duration}</div>
        </div>
      </div>
      <div className="text-sm font-semibold h-10 max-w-full line-clamp-2">
        {video.title}
      </div>
    </div>
  );
};
