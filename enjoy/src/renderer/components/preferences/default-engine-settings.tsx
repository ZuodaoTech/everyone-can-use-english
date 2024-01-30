import { t } from "i18next";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  toast,
} from "@renderer/components/ui";
import { AISettingsProviderContext } from "@renderer/context";
import { useContext } from "react";

export const DefaultEngineSettings = () => {
  const { defaultEngine, setDefaultEngine, openai } = useContext(
    AISettingsProviderContext
  );

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="flex items-center mb-2">
          <span>{t("defaultAiEngine")}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {defaultEngine === "openai" && t("openAiEngineTips")}
          {defaultEngine === "enjoyai" && t("enjoyAiEngineTips")}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Select
          value={defaultEngine}
          onValueChange={(value) => {
            setDefaultEngine(value);
            if (value === "openai" && !openai.key) {
              toast.warning(t("openaiKeyRequired"));
            }
          }}
        >
          <SelectTrigger className="min-w-fit">
            <SelectValue placeholder={t("defaultAiEngine")}></SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enjoyai">EnjoyAI</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
