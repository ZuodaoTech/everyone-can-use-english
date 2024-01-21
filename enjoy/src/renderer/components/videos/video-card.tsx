import { Link } from "react-router-dom";
import { cn } from "@renderer/lib/utils";
import { VideoIcon } from "lucide-react";

export const VideoCard = (props: {
  video: Partial<VideoType>;
  className?: string;
}) => {
  const { video, className } = props;

  return (
    <div className={cn("w-full", className)}>
      <Link to={`/videos/${video.id}`}>
        <div
          className="aspect-[4/3] border rounded-lg overflow-hidden"
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
        </div>
      </Link>
      <div className="text-sm font-semibold mt-2 max-w-full truncate">
        {video.name}
      </div>
    </div>
  );
};
