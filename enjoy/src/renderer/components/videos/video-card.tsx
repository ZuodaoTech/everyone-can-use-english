import { Link } from "react-router-dom";
import { cn } from "@renderer/lib/utils";
import { CircleAlertIcon, VideoIcon } from "lucide-react";
import { Badge } from "@renderer/components/ui";
import { t } from "i18next";

export const VideoCard = (props: {
  video: Partial<VideoType>;
  className?: string;
}) => {
  const { video, className } = props;

  return (
    <div className={cn("w-full", className)}>
      <Link to={`/videos/${video.id}`}>
        <div
          className="aspect-[4/3] border rounded-lg overflow-hidden relative"
          style={{
            borderBottomColor: `#${video.md5.substr(0, 6)}`,
            borderBottomWidth: 3,
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <VideoIcon className="w-12 h-12" />
            <img
              src={video.coverUrl}
              crossOrigin="anonymous"
              className="absolute top-0 left-0 hover:scale-105 object-cover w-full h-full bg-cover bg-center"
            />
          </div>
          {video.language && (
            <Badge className="absolute left-2 top-2">{video.language}</Badge>
          )}
          {!video.src && (
            <div
              data-tooltip-content={t("cannotFindSourceFile")}
              data-tooltip-id="global-tooltip"
              className="absolute right-2 top-2"
            >
              <CircleAlertIcon className="text-destructive w-4 h-4" />
            </div>
          )}
        </div>
      </Link>
      <div className="text-sm font-semibold mt-2 max-w-full truncate">
        {video.name}
      </div>
    </div>
  );
};
