import { CheckCircleIcon, UsersIcon } from "lucide-react";
import { Link } from "react-router-dom";

export const ChapterCard = (props: {
  chapter: ChapterType;
  active?: boolean;
}) => {
  const { chapter, active } = props;
  return (
    <Link
      to={`/courses/${chapter.courseId}/chapters/${chapter.sequence}`}
      key={chapter.id}
      className="p-2 border hover:shadow cursor-pointer rounded-lg relative"
    >
      <div className="flex items-center justify-start space-x-1 text-muted-foreground mb-1">
        <CheckCircleIcon
          className={`w-4 h-4 ${
            active
              ? "text-yellow-500"
              : chapter.finished
              ? "text-green-600"
              : "text-muted-foreground"
          }`}
        />
      </div>
      <div className="text-center text-sm font-bold font-mono mb-2">
        # {chapter.sequence}
      </div>
      <div className="text-center font-mono line-clamp-1 mb-2">
        {chapter.title}
      </div>
      {typeof chapter.finishesCount === "number" &&
        chapter.finishesCount > 0 && (
          <div className="flex items-center justify-end space-x-1 text-muted-foreground">
            <span className="text-xs">{chapter.finishesCount}</span>
            <UsersIcon className="w-3 h-3" />
          </div>
        )}
    </Link>
  );
};
