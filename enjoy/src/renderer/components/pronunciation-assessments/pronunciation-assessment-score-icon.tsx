import { cn } from "@renderer/lib/utils";

export const PronunciationAssessmentScoreIcon = (props: {
  score: number;
  size?: number;
  className?: string;
  onClick?: () => void;
}) => {
  const { score, className, onClick } = props;

  const scoreColor = (score: number, type: "text" | "bg" = "text") => {
    if (!score) return "gray";

    if (score >= 80) return type == "text" ? "text-green-600" : "bg-green-600";
    if (score >= 60)
      return type == "text" ? "text-yellow-600" : "bg-yellow-600";

    return type == "text" ? "text-red-600" : "bg-yellow-600";
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        `${scoreColor(score, "bg")} text-white rounded-full`,
        className
      )}
    >
      {score}
    </div>
  );
};
