import { t } from "i18next";
import { Button, Separator, toast } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext } from "react";

export const About = () => {
  const { version, EnjoyApp } = useContext(AppSettingsProviderContext);

  const checkUpdate = async () => {
    const platformInfo = await EnjoyApp.app.getPlatformInfo();
    if (platformInfo.platform === "linux") {
      EnjoyApp.shell.openExternal("https://1000h.org/enjoy-app/install.html");
    } else {
      EnjoyApp.app.checkForUpdates();
      toast.info(t("checkingForUpdate"));
    }
  };

  return (
    <>
      <div className="font-semibold mb-4 capitilized">{t("about")}</div>

      <div className="flex items-start justify-between py-4">
        <div className="">
          <div className="mb-2">{t("currentVersion")}</div>
          <div className="text-sm text-muted-foreground mb-2">v{version}</div>
        </div>
        <Button onClick={checkUpdate}>{t("checkUpdate")}</Button>
      </div>

      <Separator />

      <div className="flex items-start justify-between py-4">
        <div className="">
          <div className="mb-2">{t("userGuide")}</div>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            EnjoyApp.shell.openExternal("https://1000h.org/enjoy-app/");
          }}
        >
          {t("open")}
        </Button>
      </div>

      <Separator />

      <div className="flex items-start justify-between py-4">
        <div className="">
          <div className="mb-2">{t("feedback")}</div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={() => {
              EnjoyApp.shell.openExternal(
                "https://mixin.one/codes/f8ff96b8-54fb-4ad8-a6d4-5a5bdb1df13e"
              );
            }}
          >
            Mixin
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              EnjoyApp.shell.openExternal(
                "https://github.com/zuodaotech/everyone-can-use-english/discussions"
              );
            }}
          >
            GitHub
          </Button>
        </div>
      </div>
    </>
  );
};
