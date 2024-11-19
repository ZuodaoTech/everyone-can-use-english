import { t } from "i18next";
import { useContext, useState } from "react";
import { Button } from "@renderer/components/ui";
import { Link, Navigate } from "react-router-dom";
import { DbState, LoginForm } from "@renderer/components";
import {
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";

export default () => {
  const { initialized, user } = useContext(AppSettingsProviderContext);
  const [started, setStarted] = useState(false);
  const db = useContext(DbProviderContext);

  if (initialized) {
    return <Navigate to="/" replace />;
  }

  if (user && db.state === "error") {
    return (
      <div
        className="flex justify-center items-center h-full"
        date-testid="layout-db-error"
      >
        <DbState />
      </div>
    );
  }

  if (!started) {
    return (
      <div
        className="flex justify-center items-center h-full"
        date-testid="layout-onboarding"
      >
        <div className="text-center">
          <div className="text-lg mb-6">
            {t("welcomeTo")} <span className="font-semibold">Enjoy App</span>
          </div>

          <div className="">
            <Button size="lg" onClick={() => setStarted(true)}>
              {t("startToUse")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full px-4 py-6 lg:px-8 flex flex-col gap-8">
      <div className="text-center">
        <div className="text-lg font-mono py-4">{t("login")}</div>
        <div className="text-sm opacity-70">{t("loginBeforeYouStart")}</div>
      </div>
      <div className="flex-1 flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
};
