import { useForm } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext } from "react";
import { AISettingsProviderContext } from "@renderer/context";

export const GPTForm = (props: { form: ReturnType<typeof useForm> }) => {
  const { form } = props;
  const { gptProviders } = useContext(AISettingsProviderContext);

  return (
    <>
      <FormField
        control={form.control}
        name="config.gpt.engine"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gpt.engine")}</FormLabel>
            <Select
              required
              onValueChange={field.onChange}
              value={field.value as string}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectAiEngine")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.keys(gptProviders).map((key) => (
                  <SelectItem key={key} value={key}>
                    {gptProviders[key].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {gptProviders[field.value as string]?.description}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.gpt.model"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gpt.model")}</FormLabel>
            <Select
              required
              onValueChange={field.onChange}
              value={field.value as string}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectAiModel")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(
                  gptProviders[form.watch("config.gpt.engine") as string]
                    ?.models || []
                ).map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="config.gpt.temperature"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gpt.temperature")}</FormLabel>
            <div className="flex items-center space-x-1">
              <Slider
                className="flex-1"
                onValueChange={(value) => field.onChange(value[0])}
                value={[field.value as number]}
                min={0}
                max={1}
                step={0.1}
              />
              <span>{field.value as number}</span>
            </div>
            <FormDescription>{t("gpt.temperatureDescription")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="config.gpt.historyBufferSize"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gpt.historyBufferSize")}</FormLabel>
            <div className="flex items-center space-x-1">
              <Slider
                className="flex-1"
                onValueChange={(value) => field.onChange(value[0])}
                value={[field.value as number]}
                min={0}
                max={100}
                step={1}
              />
              <span>{field.value as number}</span>
            </div>
            <FormDescription>
              {t("gpt.historyBufferSizeDescription")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.gpt.maxCompletionTokens"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gpt.maxCompletionTokens")}</FormLabel>
            <Input
              type="number"
              min="-1"
              value={field.value}
              onChange={(event) => {
                if (!event.target.value) return;
                field.onChange(parseInt(event.target.value));
              }}
            />
            <FormDescription>
              {t("gpt.maxCompletionTokensDescription")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.gpt.presencePenalty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gpt.presencePenalty")}</FormLabel>
            <div className="flex items-center space-x-1">
              <Slider
                className="flex-1"
                onValueChange={(value) => field.onChange(value[0])}
                value={[field.value as number]}
                min={-2}
                max={2}
                step={0.1}
              />
              <span>{field.value as number}</span>
            </div>
            <FormDescription>
              {t("gpt.presencePenaltyDescription")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.gpt.frequencyPenalty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gpt.frequencyPenalty")}</FormLabel>
            <div className="flex items-center space-x-1">
              <Slider
                className="flex-1"
                onValueChange={(value) => field.onChange(value[0])}
                value={[field.value as number]}
                min={-2}
                max={2}
                step={0.1}
              />
              <span>{field.value as number}</span>
            </div>
            <FormDescription>
              {t("gpt.frequencyPenaltyDescription")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.gpt.numberOfChoices"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("gpt.numberOfChoices")}</FormLabel>
            <Input
              type="number"
              min="1"
              step="1.0"
              value={field.value}
              onChange={(event) => {
                field.onChange(
                  event.target.value ? parseInt(event.target.value) : 1.0
                );
              }}
            />
            <FormDescription>
              {t("gpt.numberOfChoicesDescription")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
