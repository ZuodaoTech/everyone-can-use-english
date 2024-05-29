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

export const NativeLanguageSettings = () => {
  const { nativeLanguage, switchNativeLanguage } = useContext(
    AppSettingsProviderContext
  );

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("nativeLanguage")}</div>
        <div className="text-sm text-muted-foreground mb-2">
          {LANGUAGES.find((lang) => lang.code === nativeLanguage)?.name}
        </div>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          <Select
            value={nativeLanguage}
            onValueChange={(value) => {
              switchNativeLanguage(value);
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue>
                {LANGUAGES.find((lang) => lang.code === nativeLanguage)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem
                  className="text-xs"
                  value={lang.code}
                  key={lang.code}
                >
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
