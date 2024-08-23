import { t } from "i18next";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext } from "react";
import { LANGUAGES } from "@/constants";

export const LearningLanguageSettings = () => {
  const { learningLanguage, switchLearningLanguage } = useContext(
    AppSettingsProviderContext
  );

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("learningLanguage")}</div>
        <div className="text-sm text-muted-foreground mb-2">
          {LANGUAGES.find((lang) => lang.code === learningLanguage)?.name}
        </div>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          <Select
            value={learningLanguage}
            onValueChange={(value) => {
              switchLearningLanguage(value);
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue>
                {LANGUAGES.find((lang) => lang.code === learningLanguage)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem
                  className="text-xs"
                  value={lang.code}
                  key={lang.code}
                >
                  {lang.name} ({lang.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
