import { t } from "i18next";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@renderer/components/ui";
import { PronunciationAssessmentForm } from "@renderer/components";

export default () => {
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
            <BreadcrumbPage>{t("newAssessment")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PronunciationAssessmentForm />
    </div>
  );
};
