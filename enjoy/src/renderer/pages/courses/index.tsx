import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button, toast } from "@renderer/components/ui";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import { CourseCard } from "@renderer/components";

export default () => {
  const navigate = useNavigate();

  return (
    <div className="h-full max-w-5xl mx-auto px-4 py-6">
      <div className="flex space-x-1 items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <span>{t("sidebar.courses")}</span>
      </div>
      <div className="">
        <CoursesList />
      </div>
    </div>
  );
};

const CoursesList = () => {
  const { webApi, learningLanguage } = useContext(AppSettingsProviderContext);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    if (loading) return;
    if (!webApi) return;

    webApi
      .courses({ page: nextPage, language: learningLanguage })
      .then(({ courses = [], next }) => {
        setCourses(courses);
        setNextPage(next);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (!courses.length) {
    return (
      <div className="flex items-center justify-center py-4">
        <div>
          <span>{t("noData")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-5">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};
