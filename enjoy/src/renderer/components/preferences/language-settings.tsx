import { t } from "i18next";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@renderer/components/ui";
import {
  AppSettingsProviderContext,
} from "@renderer/context";
import { useContext } from "react";

export const LanguageSettings = () => {
  const { language, switchLanguage } = useContext(AppSettingsProviderContext);

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("language")}</div>
        <div className="text-sm text-muted-foreground mb-2">
          {language === "en" ? "English" : "简体中文"}
        </div>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          <Select
            value={language}
            onValueChange={(value: "en" | "zh-CN") => {
              switchLanguage(value);
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue>
                {language === "en" ? "English" : "简体中文"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="text-xs" value="en">
                English
              </SelectItem>
              <SelectItem className="text-xs" value="zh-CN">
                简体中文
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
