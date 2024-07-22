import { t } from "i18next";
import { Switch } from "@renderer/components/ui";
import { useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";

export const VocabularySettings = () => {
  const { vocabularyConfig, setVocabularyConfig } = useContext(
    AppSettingsProviderContext
  );

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("lookupOnMouseOver")}</div>
      </div>

      <div className="">
        <Switch
          checked={vocabularyConfig.lookupOnMouseOver}
          onCheckedChange={() => {
            setVocabularyConfig({
              ...vocabularyConfig,
              lookupOnMouseOver: !vocabularyConfig.lookupOnMouseOver,
            });
          }}
        />
      </div>
    </div>
  );
};
