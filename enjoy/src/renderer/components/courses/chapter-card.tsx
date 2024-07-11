import { CheckCircleIcon } from "lucide-react";
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
      className="p-4 border hover:shadow cursor-pointer rounded-lg relative"
    >
      <div className="text-center text-sm font-bold font-mono mb-2">
        # {chapter.sequence}
      </div>
      <div className="text-center font-mono line-clamp-1">{chapter.title}</div>
      <CheckCircleIcon
        className={`absolute top-2 left-2 w-4 h-4 ${
          active
            ? "text-yellow-500"
            : chapter.finished
            ? "text-green-600"
            : "text-muted-foreground"
        }`}
      />
    </Link>
  );
};
