import { useState, useEffect, useContext } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { Button, ScrollArea, ScrollBar } from "@renderer/components/ui";
import { VideoCard, MediaAddButton } from "@renderer/components";
import { t } from "i18next";
import { Link } from "react-router-dom";

export const VideosSegment = (props: { limit?: number }) => {
  const { limit = 10 } = props;
  const [videos, setVideos] = useState<VideoType[]>([]);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  useEffect(() => {
    fetchVideos();
    addDblistener(onVideosUpdate);

    return () => {
      removeDbListener(onVideosUpdate);
    };
  }, []);

  const fetchVideos = async () => {
    const videos = await EnjoyApp.videos.findAll({
      limit,
    });
    if (!videos) return;

    setVideos(videos);
  };

  const onVideosUpdate = (event: CustomEvent) => {
    const { record, action, model } = event.detail || {};
    if (model !== "Video") return;
    if (!record) return;

    if (action === "create") {
      setVideos([record as VideoType, ...videos]);
    } else if (action === "destroy") {
      setVideos(videos.filter((r) => r.id !== record.id));
    }
  };
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {t("addedVideos")}
          </h2>
        </div>
        <div className="ml-auto mr-4">
          <Link to="/videos">
            <Button variant="link" className="capitalize">
              {t("seeMore")}
            </Button>
          </Link>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="flex items-center justify-center h-48 border border-dashed rounded-lg">
          <MediaAddButton type="Video" />
        </div>
      ) : (
        <ScrollArea>
          <div className="flex items-center space-x-4 pb-4">
            {videos.map((video) => {
              return (
                <VideoCard className="w-56" key={video.id} video={video} />
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
};
