import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Progress,
  Separator,
  toast,
} from "@renderer/components/ui";
import { Link, useNavigate, useParams } from "react-router-dom";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { CheckCircleIcon, LoaderIcon } from "lucide-react";

export default () => {
  const navigate = useNavigate();
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
    <div className="h-full max-w-5xl mx-auto px-4 py-6">
      <Breadcrumb className="mb-6">
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
        <CourseChapters course={course} />
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
          src={course?.coverUrl}
          alt={course?.title}
          className="object-cover w-full h-full rounded-lg"
        />
      </div>
      <div className="flex-1 min-h-48">
        <div className="text-2xl font-bold mb-4">{course?.title}</div>
        <div className="mb-4">{course?.description}</div>
        {course.enrolled ? (
          <>
            <div className="flex items-center space-x-2 mb-4">
              <span>{(course.enrollment.progress * 100).toFixed(2)}%</span>
              <Progress value={course.enrollment.progress * 100} />
            </div>
            <div>
              <Button onClick={handleEnroll}>{t("continueLearning")}</Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Button disabled={course.enrolled} onClick={handleEnroll}>
              {enrolling && (
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("enrollNow")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const CourseChapters = (props: { course: CourseType }) => {
  const { course } = props;
  const { webApi } = useContext(AppSettingsProviderContext);
  const [chapters, setChapters] = useState<ChapterType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchCourseChapters = async (params?: { page: number }) => {
    if (!course?.id) return;

    const { page = currentPage } = params || {};
    webApi
      .courseChapters(course.id, { page })
      .then(({ chapters, page, next }) => {
        setCurrentPage(page);
        setHasMore(!!next);
        setChapters(chapters);
      });
  };

  useEffect(() => {
    if (!course) return;
    fetchCourseChapters({ page: 1 });
  }, [course]);

  if (!course) return null;
  if (!chapters) return null;

  return (
    <div className="">
      <div className="grid gap-4 grid-cols-5 mb-4">
        {chapters.map((chapter) => (
          <Link
            to={`/courses/${course.id}/chapters/${chapter.sequence}`}
            key={chapter.id}
            className="p-4 border hover:border-dashed cursor-pointer rounded-lg relative"
          >
            <div className="text-center text-sm font-bold font-mono mb-2">
              # {chapter.sequence}
            </div>
            <div className="text-center font-mono line-clamp-1">
              {chapter.title}
            </div>
            <CheckCircleIcon
              className={`absolute top-2 left-2 w-4 h-4 ${
                chapter.finished ? "text-green-600" : "text-muted-foreground"
              }`}
            />
          </Link>
        ))}
      </div>

      <div className="flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {currentPage > 1 && (
                <PaginationPrevious
                  onClick={() => fetchCourseChapters({ page: currentPage - 1 })}
                />
              )}
            </PaginationItem>
            <PaginationItem>
              <PaginationLink>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>{hasMore && <PaginationNext />}</PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
