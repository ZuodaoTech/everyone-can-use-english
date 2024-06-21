import { Link } from "react-router-dom";
import { cn } from "@renderer/lib/utils";
import { AudioLinesIcon } from "lucide-react";
import { Badge } from "@renderer/components/ui";

export const AudioCard = (props: {
  audio: Partial<AudioType>;
  className?: string;
}) => {
  const { audio, className } = props;

  return (
    <div className={cn("w-full", className)}>
      <Link to={`/audios/${audio.id}`}>
        <div
          className="aspect-square border rounded-lg overflow-hidden flex relative"
          style={{
            borderBottomColor: `#${audio.md5.slice(0, 6)}`,
            borderBottomWidth: 3,
          }}
        >
          {audio.coverUrl ? (
            <img
              src={audio.coverUrl}
              crossOrigin="anonymous"
              className="hover:scale-105 object-cover w-full h-full"
            />
          ) : (
            <AudioLinesIcon className="hover:scale-105 object-cover w-1/2 h-1/2 m-auto" />
          )}

          {audio.language && (
            <Badge className="absolute left-2 top-2">{audio.language}</Badge>
          )}
        </div>
      </Link>
      <div className="text-sm font-semibold mt-2 max-w-full line-clamp-2 h-10">
        {audio.name}
      </div>
    </div>
  );
};
