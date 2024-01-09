import { t } from "i18next";
import { Button, useToast } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useState, useContext } from "react";
import { LoaderIcon } from "lucide-react";

export const About = () => {
  const { version } = useContext(AppSettingsProviderContext);
  const [checking, setChecking] = useState<boolean>(false);
  const { toast } = useToast();
  const checkUpdate = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      toast({
        description: t("alreadyLatestVersion"),
      });
    }, 1000);
  };

  return (
    <>
      <div className="font-semibold mb-4 capitilized">{t("about")}</div>

      <div className="flex items-start justify-between py-4">
        <div className="">
          <div className="mb-2">{t("currentVersion")}</div>
          <div className="text-sm text-muted-foreground mb-2">v{version}</div>
        </div>
        <Button disabled={checking} onClick={checkUpdate}>
          {checking && <LoaderIcon className="animate-spin mr-1 w-4 h-4" />}
          {t("checkUpdate")}
        </Button>
      </div>
    </>
  );
};
