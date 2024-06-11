import { useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button, toast } from "@renderer/components/ui";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import { PronunciationAssessmentCard } from "@renderer/components";

export default () => {
  const navigate = useNavigate();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [assessments, setAssessments] = useState<PronunciationAssessmentType[]>(
    []
  );
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchAssessments = (params?: { offset: number; limit?: number }) => {
    const { offset = 0, limit = 10 } = params || {};
    if (offset > 0 && !hasMore) return;

    EnjoyApp.pronunciationAssessments
      .findAll({
        limit,
        offset,
      })
      .then((fetchedAssessments) => {
        if (offset === 0) {
          setAssessments(fetchedAssessments);
        } else {
          setAssessments([...assessments, ...fetchedAssessments]);
        }
        setHasMore(fetchedAssessments.length === limit);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  return (
    <div className="h-full px-4 py-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex space-x-1 items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <span>{t("sidebar.pronunciationAssessment")}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          {assessments.map((assessment) => (
            <PronunciationAssessmentCard
              key={assessment.id}
              pronunciationAssessment={assessment}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={() => fetchAssessments({ offset: assessments.length })}
            >
              {t("loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
