import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, ScrollArea, ScrollBar } from "@renderer/components/ui";
import { t } from "i18next";
import { AppSettingsProviderContext } from "@renderer/context";
import { CourseCard } from "./course-card";

export const EnrollmentSegment = () => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [enrollments, setEnrollments] = useState<EnrollmentType[]>([]);
  const fetchEnrollments = async () => {
    webApi
      .enrollments()
      .then(({ enrollments }) => {
        setEnrollments(enrollments);
      })
      .catch((err) => {
        console.error(err.message);
      });
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  if (!enrollments?.length) return null;

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {t("enrollments")}
          </h2>
        </div>
        <div className="ml-auto mr-4">
          <Link to="/courses">
            <Button variant="link" className="capitalize">
              {t("seeMore")}
            </Button>
          </Link>
        </div>
      </div>

      <ScrollArea>
        <div className="flex items-center space-x-4 pb-4">
          {enrollments.map((enrollment) => {
            return (
              <CourseCard
                className="w-36"
                key={enrollment.id}
                course={enrollment.course}
                progress={enrollment.progress * 100}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
