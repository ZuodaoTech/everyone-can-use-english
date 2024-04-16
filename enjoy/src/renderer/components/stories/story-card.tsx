import { Link } from "react-router-dom";
import { cn, imgErrorToDefalut } from "@renderer/lib/utils";

export const StoryCard = (props: { story: StoryType; className?: string }) => {
  const { story, className } = props;

  if (!story) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <Link to={`/stories/${story.id}`}>
        <div className="border rounded-lg overflow-hidden cursor-pointer">
          <div className="aspect-[16/9] overflow-hidden">
            <img
              crossOrigin="anonymous"
              src={story.metadata.image}
              onError={imgErrorToDefalut} 
              className="w-full h-full object-cover hover:scale-105"
            />
          </div>

          <div className="overflow-hidden px-4 py-2 h-16">
            <div className="font-semibold line-clamp-2 ">{story.title}</div>
          </div>
        </div>
      </Link>
    </div>
  );
};
