import { t } from "i18next";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { Input, Button, toast } from "@renderer/components/ui";

export const AzureSpeechSettings = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [key, setKey] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  const fetchSettings = async () => {
    const _key = await EnjoyApp.appSettings.getAzureSpeechKey();
    const _region = await EnjoyApp.appSettings.getAzureSpeechRegion();
    setKey(_key || "");
    setRegion(_region || "");
  };

  const handleSave = async () => {
    await EnjoyApp.appSettings.setAzureSpeechKey(key);
    await EnjoyApp.appSettings.setAzureSpeechRegion(region);
    toast.success(t("settingsSaved"));
  };

  const handleReset = async () => {
    await EnjoyApp.appSettings.setAzureSpeechKey("");
    await EnjoyApp.appSettings.setAzureSpeechRegion("");
    setKey("");
    setRegion("");
    toast.success(t("settingsReset"));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2 text-sm font-semibold">
          {t("azureSpeechSettings")}
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          {t("azureSpeechSettingsDescription")}
        </div>
        <div className="grid gap-4 max-w-2xl">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("azureSpeechKey")}
            </label>
            <Input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Bk5jPFEdsFLMe0AUYRtyPWwjxczIWr1t..."
              className="w-full font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {t("azureSpeechKeyDescription")}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("azureSpeechRegion")}
            </label>
            <Input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="eastus"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {t("azureSpeechRegionDescription")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              {t("save")}
            </Button>
            <Button onClick={handleReset} size="sm" variant="secondary">
              {t("reset")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
