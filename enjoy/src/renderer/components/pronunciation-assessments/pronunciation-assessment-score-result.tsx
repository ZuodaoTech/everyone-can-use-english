import { Button, RadialProgress, Progress } from "@renderer/components/ui";
import { t } from "i18next";
import { cn } from "@renderer/lib/utils";
import { InfoIcon, LoaderIcon } from "lucide-react";

export const PronunciationAssessmentScoreResult = (props: {
  pronunciationScore?: number;
  accuracyScore?: number;
  fluencyScore?: number;
  completenessScore?: number;
  prosodyScore?: number;
  assessing?: boolean;
  onAssess?: () => void;
}) => {
  const {
    assessing = false,
    onAssess,
    pronunciationScore,
    accuracyScore,
    fluencyScore,
    completenessScore,
    prosodyScore,
  } = props;

  return (
    <div className="flex-1 p-4 flex items-center justify-center relative">
      <div
        className={`grid grid-cols-3 gap-8 ${
          pronunciationScore ? "" : "blur-sm"
        }`}
      >
        <div className="">
          <div
            className="mb-4 text-center"
            data-tooltip-id="recording-tooltip"
            data-tooltip-content={t(
              "models.pronunciationAssessment.explainations.pronunciationScore"
            )}
          >
            {t("pronunciationAssessment")}
          </div>
          <RadialProgress
            className="w-40 h-40 mx-auto mb-4"
            ringClassName={`${scoreColor(pronunciationScore || 0)}`}
            progress={pronunciationScore || 0}
            fontSize={24}
          />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-red-600"></span>
              <span className="text-sm">0~59</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-yellow-600"></span>
              <span className="text-sm">60~79</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-green-600"></span>
              <span className="text-sm">80~100</span>
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col justify-between w-full">
          <ScoreBarComponent
            score={accuracyScore}
            label={t("models.pronunciationAssessment.accuracyScore")}
            explaination={t(
              "models.pronunciationAssessment.explainations.accuracyScore"
            )}
          />
          <ScoreBarComponent
            score={fluencyScore}
            label={t("models.pronunciationAssessment.fluencyScore")}
            explaination={t(
              "models.pronunciationAssessment.explainations.fluencyScore"
            )}
          />
          <ScoreBarComponent
            score={completenessScore}
            label={t("models.pronunciationAssessment.completenessScore")}
            explaination={t(
              "models.pronunciationAssessment.explainations.completenessScore"
            )}
          />
          {prosodyScore && (
            <ScoreBarComponent
              score={prosodyScore}
              label={t("models.pronunciationAssessment.prosodyScore")}
              explaination={t(
                "models.pronunciationAssessment.explainations.prosodyScore"
              )}
            />
          )}
        </div>
      </div>

      {!pronunciationScore && (
        <div className="w-full h-full absolute z-30 bg-background/10 flex items-center justify-center">
          <Button size="lg" disabled={assessing} onClick={onAssess}>
            {assessing && (
              <LoaderIcon className="w-4 h-4 animate-spin inline mr-2" />
            )}
            {t("pronunciationAssessment")}
          </Button>
        </div>
      )}
    </div>
  );
};

const ScoreBarComponent = ({
  label,
  explaination,
  score,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  explaination?: string;
  score: number;
}) => {
  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="flex items-center justify-between mb-2">
        <span>
          {label}
          <InfoIcon
            data-tooltip-id="recording-tooltip"
            data-tooltip-content={explaination}
            className="inline w-3 h-3 cursor-pointer ml-2"
          />
        </span>
        <span>{score}</span>
      </div>
      <Progress
        className="h-3"
        indicatorClassName={scoreColor(score, "bg")}
        value={score || 0}
      />
    </div>
  );
};

export const scoreColor = (score: number, type: "text" | "bg" = "text") => {
  if (!score) return "gray";

  if (score >= 80) return type == "text" ? "text-green-600" : "bg-green-600";
  if (score >= 60) return type == "text" ? "text-yellow-600" : "bg-yellow-600";

  return type == "text" ? "text-red-600" : "bg-yellow-600";
};
