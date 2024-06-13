import { Button, RadialProgress } from "@renderer/components/ui";
import { scoreColor } from "./pronunciation-assessment-score-result";
import { t } from "i18next";
import { formatDateTime } from "@/renderer/lib/utils";

export const PronunciationAssessmentCard = (props: {
  pronunciationAssessment: PronunciationAssessmentType;
  onSelect: (assessment: PronunciationAssessmentType) => void;
}) => {
  const { pronunciationAssessment: assessment, onSelect } = props;

  return (
    <div
      key={assessment.id}
      className="bg-background p-4 rounded-lg border hover:shadow"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-1 flex flex-col h-32">
          <div className="select-text line-clamp-2 text-muted-foreground font-serif pl-3 border-l-4 mb-4">
            {assessment.referenceText || assessment.target.referenceText}
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {[
              {
                label: t("models.pronunciationAssessment.pronunciationScore"),
                value: assessment.pronunciationScore,
              },
              {
                label: t("models.pronunciationAssessment.accuracyScore"),
                value: assessment.accuracyScore,
              },
              {
                label: t("models.pronunciationAssessment.fluencyScore"),
                value: assessment.fluencyScore,
              },
              {
                label: t("models.pronunciationAssessment.completenessScore"),
                value: assessment.completenessScore,
              },
              {
                label: t("models.pronunciationAssessment.prosodyScore"),
                value: assessment.prosodyScore,
              },
              {
                label: t("models.pronunciationAssessment.grammarScore"),
                value: assessment.grammarScore,
              },
              {
                label: t("models.pronunciationAssessment.vocabularyScore"),
                value: assessment.vocabularyScore,
              },
              {
                label: t("models.pronunciationAssessment.topicScore"),
                value: assessment.topicScore,
              },
            ].map(({ label, value }) => {
              if (typeof value === "number") {
                return (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-muted-foreground text-sm">
                      {label}:
                    </span>
                    <span
                      className={`text-sm font-bold ${scoreColor(value || 0)}`}
                    >
                      {value}
                    </span>
                  </div>
                );
              }
            })}
          </div>
          <div className="mt-auto">
            <div className="text-xs text-muted-foreground">
              {formatDateTime(assessment.createdAt)}
            </div>
          </div>
        </div>
        <div className="h-32">
          <RadialProgress
            className="w-20 h-20 mx-auto mb-2"
            ringClassName={`${scoreColor(assessment.pronunciationScore || 0)}`}
            progress={assessment.pronunciationScore || 0}
            fontSize={24}
          />
          <div className="flex justify-center">
            <Button
              onClick={() => onSelect(assessment)}
              variant="secondary"
              size="sm"
            >
              {t("detail")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
