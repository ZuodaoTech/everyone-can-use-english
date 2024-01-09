import { t } from "i18next";
import { Button, Separator } from "@renderer/components/ui";
import { ResetAllButton } from "@renderer/components";
import { InfoIcon } from "lucide-react";

export const AdvancedSettings = () => {
  return (
    <>
      <div className="font-semibold mb-4 capitilized">
        {t("advancedSettings")}
      </div>

      <div className="flex items-start justify-between py-4">
        <div className="">
          <div className="mb-2">{t("resetAll")}</div>
          <div className="text-sm text-muted-foreground mb-2">
            {t("logoutAndRemoveAllPersonalData")}
          </div>
        </div>

        <div className="">
          <div className="mb-2 flex justify-end">
            <ResetAllButton>
              <Button
                variant="secondary"
                className="text-destructive"
                size="sm"
              >
                {t("reset")}
              </Button>
            </ResetAllButton>
          </div>
          <div className="text-xs text-muted-foreground">
            <InfoIcon className="mr-1 w-3 h-3 inline" />
            <span>{t("relaunchIsNeededAfterChanged")}</span>
          </div>
        </div>
      </div>

      <Separator />
    </>
  );
};
