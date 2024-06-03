import { t } from "i18next";
import { useForm } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
} from "@renderer/components/ui";

export const ConversationFormGPT = (props: {
  conversation: Partial<ConversationType>;
  form: ReturnType<typeof useForm>;
  gptProviders: any;
}) => {
  const { form, gptProviders, conversation } = props;

  return (
    <>
      <FormField
        control={form.control}
        name="engine"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("models.conversation.engine")}</FormLabel>
            <Select
              disabled={Boolean(conversation?.id)}
              onValueChange={field.onChange}
              value={field.value}
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
              {gptProviders[form.watch("engine")]?.description}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="configuration.model"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("models.conversation.model")}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectAiModel")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(gptProviders[form.watch("engine")]?.models || []).map(
                  (option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="configuration.roleDefinition"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("models.conversation.roleDefinition")}</FormLabel>
            <Textarea
              placeholder={t("models.conversation.roleDefinitionPlaceholder")}
              className="h-64"
              {...field}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      {gptProviders[form.watch("engine")]?.configurable.includes(
        "temperature"
      ) && (
        <FormField
          control={form.control}
          name="configuration.temperature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("models.conversation.temperature")}</FormLabel>
              <Input
                type="number"
                min="0"
                max="1.0"
                step="0.1"
                value={field.value}
                onChange={(event) => {
                  field.onChange(
                    event.target.value ? parseFloat(event.target.value) : 0.0
                  );
                }}
              />
              <FormDescription>
                {t("models.conversation.temperatureDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {gptProviders[form.watch("engine")]?.configurable.includes(
        "maxTokens"
      ) && (
        <FormField
          control={form.control}
          name="configuration.maxTokens"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("models.conversation.maxTokens")}</FormLabel>
              <Input
                type="number"
                min="0"
                value={field.value}
                onChange={(event) => {
                  if (!event.target.value) return;
                  field.onChange(parseInt(event.target.value));
                }}
              />
              <FormDescription>
                {t("models.conversation.maxTokensDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {gptProviders[form.watch("engine")]?.configurable.includes(
        "presencePenalty"
      ) && (
        <FormField
          control={form.control}
          name="configuration.presencePenalty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("models.conversation.presencePenalty")}</FormLabel>
              <Input
                type="number"
                min="-2"
                step="0.1"
                max="2"
                value={field.value}
                onChange={(event) => {
                  if (!event.target.value) return;
                  field.onChange(parseInt(event.target.value));
                }}
              />
              <FormDescription>
                {t("models.conversation.presencePenaltyDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {gptProviders[form.watch("engine")]?.configurable.includes(
        "frequencyPenalty"
      ) && (
        <FormField
          control={form.control}
          name="configuration.frequencyPenalty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("models.conversation.frequencyPenalty")}</FormLabel>
              <Input
                type="number"
                min="-2"
                step="0.1"
                max="2"
                value={field.value}
                onChange={(event) => {
                  if (!event.target.value) return;
                  field.onChange(parseInt(event.target.value));
                }}
              />
              <FormDescription>
                {t("models.conversation.frequencyPenaltyDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {gptProviders[form.watch("engine")]?.configurable.includes(
        "numberOfChoices"
      ) && (
        <FormField
          control={form.control}
          name="configuration.numberOfChoices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("models.conversation.numberOfChoices")}</FormLabel>
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
                {t("models.conversation.numberOfChoicesDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="configuration.historyBufferSize"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("models.conversation.historyBufferSize")}</FormLabel>
            <Input
              type="number"
              min="0"
              step="1"
              max="100"
              value={field.value}
              onChange={(event) => {
                field.onChange(
                  event.target.value ? parseInt(event.target.value) : 0
                );
              }}
            />
            <FormDescription>
              {t("models.conversation.historyBufferSizeDescription")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {gptProviders[form.watch("engine")]?.configurable.includes("baseUrl") && (
        <FormField
          control={form.control}
          name="configuration.baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("models.conversation.baseUrl")}</FormLabel>
              <Input
                {...field}
                placeholder={t("models.conversation.baseUrlDescription")}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};
