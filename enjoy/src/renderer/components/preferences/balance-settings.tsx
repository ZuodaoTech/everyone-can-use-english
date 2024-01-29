import { t } from "i18next";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState, useEffect } from "react";
import { Button } from "@renderer/components/ui";

export const BalanceSettings = () => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    webApi.me().then((user) => {
      setBalance(user.balance);
    });
  }, []);

  if (!balance) return null;
  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("balance")}</div>
        <div className="text-sm text-muted-foreground mb-2">${balance}</div>
      </div>
      <Button
        data-tooltip-id="preferences-tooltip"
        data-tooltip-content={t("notAvailableYet")}
        variant="secondary"
        size="sm"
        className="cursor-not-allowed"
      >
        {t("deposit")}
      </Button>
    </div>
  );
};
