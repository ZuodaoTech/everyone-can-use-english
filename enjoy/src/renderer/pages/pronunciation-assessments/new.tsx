import { ChevronLeftIcon } from "lucide-react";
import { t } from "i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@renderer/components/ui";
import { PronunciationAssessmentForm } from "@renderer/components";

export default () => {
  const navigate = useNavigate();

  return (
    <div className="h-full px-4 py-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex space-x-1 items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <Link to="/pronunciation_assessments">
            {t("sidebar.pronunciationAssessment")}
          </Link>
          <span>/</span>
          <span>{t("newAssessment")}</span>
        </div>
        <div className="">
          <PronunciationAssessmentForm />
        </div>
      </div>
    </div>
  );
};
