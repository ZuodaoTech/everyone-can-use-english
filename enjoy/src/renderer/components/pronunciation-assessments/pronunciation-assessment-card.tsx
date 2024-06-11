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
            {assessment.accuracyScore && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-muted-foreground text-sm">
                  {t("models.pronunciationAssessment.accuracyScore")}:
                </span>
                <span
                  className={`text-sm font-bold ${scoreColor(
                    assessment.accuracyScore || 0
                  )}`}
                >
                  {assessment.accuracyScore}
                </span>
              </div>
            )}
            {assessment.fluencyScore && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-muted-foreground text-sm">
                  {t("models.pronunciationAssessment.fluencyScore")}:
                </span>
                <span
                  className={`text-sm font-bold ${scoreColor(
                    assessment.fluencyScore || 0
                  )}`}
                >
                  {assessment.fluencyScore}
                </span>
              </div>
            )}
            {assessment.completenessScore && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-muted-foreground text-sm">
                  {t("models.pronunciationAssessment.completenessScore")}:
                </span>
                <span
                  className={`text-sm font-bold ${scoreColor(
                    assessment.completenessScore || 0
                  )}`}
                >
                  {assessment.completenessScore}
                </span>
              </div>
            )}
            {assessment.prosodyScore && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-muted-foreground text-sm">
                  {t("models.pronunciationAssessment.prosodyScore")}:
                </span>
                <span
                  className={`text-sm font-bold ${scoreColor(
                    assessment.prosodyScore || 0
                  )}`}
                >
                  {assessment.prosodyScore}
                </span>
              </div>
            )}
            {assessment.grammarScore && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-muted-foreground text-sm">
                  {t("models.pronunciationAssessment.grammarScore")}:
                </span>
                <span
                  className={`text-sm font-bold ${scoreColor(
                    assessment.grammarScore || 0
                  )}`}
                >
                  {assessment.grammarScore}
                </span>
              </div>
            )}
            {assessment.vocabularyScore && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-muted-foreground text-sm">
                  {t("models.pronunciationAssessment.vocabularyScore")}:
                </span>
                <span
                  className={`text-sm font-bold ${scoreColor(
                    assessment.vocabularyScore || 0
                  )}`}
                >
                  {assessment.vocabularyScore}
                </span>
              </div>
            )}
            {assessment.topicScore && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-muted-foreground text-sm">
                  {t("models.pronunciationAssessment.topicScore")}:
                </span>
                <span
                  className={`text-sm font-bold ${scoreColor(
                    assessment.topicScore || 0
                  )}`}
                >
                  {assessment.topicScore}
                </span>
              </div>
            )}
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
