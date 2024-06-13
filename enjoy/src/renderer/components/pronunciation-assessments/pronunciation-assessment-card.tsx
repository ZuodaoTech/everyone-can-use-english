import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  RadialProgress,
  Badge,
} from "@renderer/components/ui";
import { scoreColor } from "./pronunciation-assessment-score-result";
import { t } from "i18next";
import { formatDateTime } from "@/renderer/lib/utils";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";

export const PronunciationAssessmentCard = (props: {
  pronunciationAssessment: PronunciationAssessmentType;
  onSelect: (assessment: PronunciationAssessmentType) => void;
  onDelete: (assessment: PronunciationAssessmentType) => void;
}) => {
  const { pronunciationAssessment: assessment, onSelect, onDelete } = props;

  return (
    <div
      key={assessment.id}
      className="bg-background p-4 rounded-lg border hover:shadow"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-1 flex flex-col min-h-32">
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
          {["Audio", "Video"].includes(assessment.target?.targetType) && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">{t("source")}:</span>
              <Link
                to={`/${assessment.target.targetType.toLowerCase()}s/${
                  assessment.target.targetId
                }?segmentIndex=${assessment.target.referenceId}`}
                className="text-sm"
              >
                {t(assessment.target?.targetType?.toLowerCase())}
              </Link>
            </div>
          )}
          <div className="mt-auto flex items-center gap-4">
            {assessment.language && <Badge variant="secondary">{assessment.language}</Badge>}
            <div className="text-xs text-muted-foreground">
              {formatDateTime(assessment.createdAt)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreHorizontalIcon className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => onDelete(assessment)}
                >
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  <span>{t("delete")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
