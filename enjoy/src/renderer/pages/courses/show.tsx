import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Progress,
  Separator,
  toast,
} from "@renderer/components/ui";
import { Link, useParams } from "react-router-dom";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { LoaderIcon, UsersIcon } from "lucide-react";
import { Chapters } from "@renderer/components";

export default () => {
  const { id } = useParams<{ id: string }>();
  const { webApi } = useContext(AppSettingsProviderContext);
  const [course, setCourse] = useState<CourseType | null>(null);

  const fetchCourse = async (id: string) => {
    webApi
      .course(id)
      .then((course) => setCourse(course))
      .catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    fetchCourse(id);
  }, [id]);

  return (
    <div className="min-h-full max-w-5xl mx-auto px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/courses">{t("sidebar.courses")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>{course?.title || id}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <CourseDetail course={course} onUpdate={() => fetchCourse(course.id)} />
      </div>
      <Separator className="mb-6" />
      <div className="mb-6">
        <Chapters course={course} />
      </div>
    </div>
  );
};

const CourseDetail = (props: { course: CourseType; onUpdate: () => void }) => {
  const { course, onUpdate } = props;
  const { webApi } = useContext(AppSettingsProviderContext);
  const [enrolling, setEnrolling] = useState(false);
  const handleEnroll = async () => {
    if (!course) return;
    if (course.enrolled) return;

    setEnrolling(true);
    webApi
      .createEnrollment(course.id)
      .then(() => onUpdate())
      .catch((err) => toast.error(err.message))
      .finally(() => setEnrolling(false));
  };

  if (!course) return null;
  return (
    <div className="flex items-center justify-between mb-4 gap-4">
      <div className="h-48 aspect-square bg-black/10 rounded">
        <img
          src={course.coverUrl}
          alt={course.title}
          className="object-cover w-full h-full rounded-lg"
        />
      </div>
      <div className="flex-1 min-h-48">
        <div className="text-2xl font-bold mb-4">{course.title}</div>
        <div className="mb-4">{course.description}</div>
        {course.enrolled && (
          <div className="flex items-center space-x-2 mb-4">
            <span>{(course.enrollment.progress * 100).toFixed(2)}%</span>
            <Progress value={course.enrollment.progress * 100} />
          </div>
        )}
        <div className="flex items-center gap-4">
          {course.enrolled ? (
            <Link
              to={`/courses/${course.id}/chapters/${
                course.enrollment.currentChapterSequence || 1
              }`}
            >
              <Button onClick={handleEnroll}>{t("continueLearning")}</Button>
            </Link>
          ) : (
            <Button disabled={course.enrolled} onClick={handleEnroll}>
              {enrolling && (
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("enrollNow")}
            </Button>
          )}
          {course.enrollmentsCount > 0 && (
            <div className="flex items-center space-x-1">
              <UsersIcon className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">
                {course.enrollmentsCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
