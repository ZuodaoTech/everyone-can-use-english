import { t } from "i18next";
import { useContext } from "react";
import { Button } from "@renderer/components/ui";
import { Link } from "react-router-dom";
import { LoginForm } from "@renderer/components";
import { AppSettingsProviderContext } from "@renderer/context";

export default () => {
  const { initialized } = useContext(AppSettingsProviderContext);

  return (
    <div className="h-screen w-full px-4 py-6 lg:px-8 flex flex-col">
      <div className="text-center">
        <div className="text-lg font-mono py-6">{t("login")}</div>
        <div className="text-sm opacity-70">{t("loginBeforeYouStart")}</div>
      </div>
      <div className="flex-1 flex justify-center items-center">
        <LoginForm />
      </div>
      <div className="mt-auto">
        <div className="flex mb-4 justify-end space-x-4">
          {initialized && (
            <Link data-testid="start-to-use-button" to="/" replace>
              <Button className="w-24">{t("startToUse")}</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
