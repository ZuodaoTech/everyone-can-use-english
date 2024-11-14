import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { CourseCard, LoaderSpin } from "@renderer/components";

export default () => {
  return (
    <div className="min-h-full max-w-5xl mx-auto px-4 py-6">
      <CoursesList />
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

    setLoading(true);
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

  if (loading) {
    return <LoaderSpin />;
  }

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
