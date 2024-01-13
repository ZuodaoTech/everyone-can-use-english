import { Link } from "react-router-dom";

export const PostStory = (props: { story: StoryType }) => {
  const { story } = props;
  return (
    <Link className="block" to={`/stories/${story.id}`}>
      <div className="rounded-lg flex items-start border">
        <div className="aspect-square h-36 bg-muted">
          <img
            src={story.metadata?.image}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="px-4 py-2">
          <div className="line-clamp-2 text-lg font-semibold mb-2">
            {story.metadata?.title}
          </div>
          <div className="line-clamp-3 text-sm text-muted-foreground">
            {story.metadata?.description}
          </div>
        </div>
      </div>
    </Link>
  );
};
