import { t } from "i18next";
import { Separator } from "@renderer/components/ui";
import { LanguageSettings, ThemeSettings } from "@renderer/components";

export const Appearance = () => {
  return (
    <>
      <div className="font-semibold mb-4 capitilized">{t("appearance")}</div>
      <ThemeSettings />
      <Separator />
      <LanguageSettings />
    </>
  );
};
