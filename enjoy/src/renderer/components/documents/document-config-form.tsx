import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@renderer/components/ui";
import { t } from "i18next";
import { TTSForm } from "@renderer/components";
import { LoaderIcon } from "lucide-react";
import { useContext, useState } from "react";
import { AISettingsProviderContext } from "@renderer/context";

const documentConfigSchema = z.object({
  config: z.object({
    autoTranslate: z.boolean(),
    autoNextSpeech: z.boolean(),
    layout: z.enum(["horizontal", "vertical"]),
    tts: z.object({
      engine: z.string(),
      model: z.string(),
      voice: z.string(),
      language: z.string(),
    }),
  }),
});

export const DocumentConfigForm = (props: {
  config?: DocumentEType["config"];
  onSubmit: (data: z.infer<typeof documentConfigSchema>) => Promise<void>;
}) => {
  const { config, onSubmit } = props;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { ttsConfig } = useContext(AISettingsProviderContext);

  const form = useForm<z.infer<typeof documentConfigSchema>>({
    resolver: zodResolver(documentConfigSchema),
    defaultValues: config
      ? { config }
      : {
          config: {
            autoTranslate: true,
            autoNextSpeech: true,
            tts: ttsConfig,
          },
        },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          setSubmitting(true);
          onSubmit(data).finally(() => {
            setSubmitting(false);
          });
        })}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="config.autoTranslate"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between space-x-2">
                  <FormLabel>{t("autoTranslate")}</FormLabel>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.autoNextSpeech"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between space-x-2">
                  <FormLabel>{t("autoNextSpeech")}</FormLabel>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.layout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("layout")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("horizontal")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">
                      {t("horizontal")}
                    </SelectItem>
                    <SelectItem value="vertical">{t("vertical")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <TTSForm form={form} />
        </div>

        <div className="flex justify-end my-4">
          <Button type="submit" disabled={submitting}>
            {submitting && <LoaderIcon className="w-4 h-4 animate-spin mr-2" />}
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
