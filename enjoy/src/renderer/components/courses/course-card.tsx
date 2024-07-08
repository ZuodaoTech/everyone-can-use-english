import { GraduationCapIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "../ui";

export const CourseCard = (props: {
  course: CourseType;
  progress?: number;
  className?: string;
}) => {
  const { course, progress = 0, className = "" } = props;

  return (
    <div className={className}>
      <Link to={`/courses/${course.id}`}>
        <div className="aspect-square rounded-lg border overflow-hidden flex relative">
          {course.coverUrl ? (
            <img
              src={course.coverUrl}
              crossOrigin="anonymous"
              className="hover:scale-105 object-cover w-full h-full"
            />
          ) : (
            <GraduationCapIcon className="hover:scale-105 object-cover w-1/2 h-1/2 m-auto" />
          )}
          <Progress
            className="absolute bottom-0 left-0 right-0"
            value={progress}
          />
        </div>
      </Link>
      <div className="text-sm font-semibold mt-2 max-w-full line-clamp-2 h-10">
        {course.title}
      </div>
    </div>
  );
};
