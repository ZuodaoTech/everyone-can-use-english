import { ChevronLeftIcon } from "lucide-react";
import { t } from "i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
} from "@renderer/components/ui";
import { PronunciationAssessmentForm } from "@renderer/components";

export default () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full px-4 py-6 lg:px-8 max-w-5xl mx-auto">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/pronunciation_assessments`}>
                {t("sidebar.pronunciationAssessment")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{t("newAssessment")}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PronunciationAssessmentForm />
    </div>
  );
};
