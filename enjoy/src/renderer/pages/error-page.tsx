import { PagePlaceholder } from "@renderer/components";
import { useRouteError } from "react-router-dom";
import { t } from "i18next";

export default () => {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="h-screen px-4 py-6 lg:px-8">
      <PagePlaceholder
        placeholder={t("somethingWentWrong")}
        extra={error ? JSON.stringify(error) : ""}
        showBackButton
      />
    </div>
  );
};
