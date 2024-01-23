import { Link } from "react-router-dom";
import { cn } from "@renderer/lib/utils";

export const AudioCard = (props: {
  audio: Partial<AudioType>;
  className?: string;
}) => {
  const { audio, className } = props;

  return (
    <div className={cn("w-full", className)}>
      <Link to={`/audios/${audio.id}`}>
        <div
          className="aspect-square border rounded-lg overflow-hidden"
          style={{
            borderBottomColor: `#${audio.md5.substr(0, 6)}`,
            borderBottomWidth: 3,
          }}
        >
          <img
            src={audio.coverUrl ? audio.coverUrl : "./assets/sound-waves.png"}
            crossOrigin="anonymous"
            className="hover:scale-105 object-cover w-full h-full"
          />
          )
        </div>
      </Link>
      <div className="text-sm font-semibold mt-2 max-w-full line-clamp-2 h-10">
        {audio.name}
      </div>
    </div>
  );
};
