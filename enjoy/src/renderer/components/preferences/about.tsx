import { t } from "i18next";
import { Button } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext } from "react";

export const About = () => {
  const { version, EnjoyApp } = useContext(AppSettingsProviderContext);

  return (
    <>
      <div className="font-semibold mb-4 capitilized">{t("about")}</div>

      <div className="flex items-start justify-between py-4">
        <div className="">
          <div className="mb-2">{t("currentVersion")}</div>
          <div className="text-sm text-muted-foreground mb-2">v{version}</div>
        </div>
        <Button
          onClick={() => {
            EnjoyApp.shell.openExternal(
              "https://github.com/xiaolai/everyone-can-use-english/releases/latest"
            );
          }}
        >
          {t("checkUpdate")}
        </Button>
      </div>
    </>
  );
};
