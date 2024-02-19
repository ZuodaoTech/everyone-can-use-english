import { Sidebar } from "./sidebar";
import { Outlet, Link } from "react-router-dom";
import {
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { useContext } from "react";
import { Button } from "@renderer/components/ui/button";
import { DbState } from "@renderer/components";
import { t } from "i18next";

export const Layout = () => {
  const { initialized } = useContext(AppSettingsProviderContext);
  const db = useContext(DbProviderContext);

  if (!initialized) {
    return (
      <div
        className="h-screen flex justify-center items-center"
        date-testid="layout-onboarding"
      >
        <div className="text-center">
          <div className="text-lg mb-6">
            {t("welcomeTo")} <span className="font-semibold">Enjoy App</span>
          </div>

          <div className="">
            <Link to="/landing" replace>
              <Button size="lg">{t("startToUse")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  } else if (db.state === "connected") {
    return (
      <div className="min-h-screen" data-testid="layout-home">
        <div className="flex flex-start">
          <Sidebar />
          <div className="flex-1 border-l overflow-x-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className="h-screen w-screen flex justify-center items-center"
        data-testid="layout-db-error"
      >
        <DbState />
      </div>
    );
  }
};
