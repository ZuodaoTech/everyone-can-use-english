import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Form,
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
} from "@renderer/components/ui";
import { t } from "i18next";
import { LANGUAGES } from "@/constants";

const transcriptionSchema = z.object({
  language: z.string(),
  service: z.string(),
  text: z.string().optional(),
});

export const TranscriptionCreateForm = (props: {
  onSubmit: (data: z.infer<typeof transcriptionSchema>) => void;
  onCancel: () => void;
}) => {
  const { onSubmit, onCancel } = props;
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const { whisperConfig } = useContext(AISettingsProviderContext);

  const form = useForm<z.infer<typeof transcriptionSchema>>({
    resolver: zodResolver(transcriptionSchema),
    values: {
      language: learningLanguage,
      service: whisperConfig.service,
      text: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof transcriptionSchema>) => {
    console.log(data);
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="gap-4 grid w-full"
      >
        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem className="grid w-full items-center gap-1.5">
              <FormLabel>{t("sttAiService")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">{t("local")}</SelectItem>
                  <SelectItem value="azure">{t("azureAi")}</SelectItem>
                  <SelectItem value="cloudflare">
                    {t("cloudflareAi")}
                  </SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="grid w-full items-center gap-1.5">
              <FormLabel>{t("language")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
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
          name="text"
          render={({ field }) => (
            <FormItem className="grid w-full items-center gap-1.5">
              <FormLabel>
                {t("transcript")}({t("optinal")})
              </FormLabel>
              <Input
                className="mb-2"
                type="file"
                accept=".txt,.srt,.vtt"
                onChange={(event) => {
                  const file = event.target.files[0];

                  if (file) {
                    if (file.type !== "text/plain") {
                      return alert(t("onlyTextFileSupported"));
                    }
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      field.onChange(e.target.result as string);
                    };
                    reader.readAsText(file);
                  } else {
                    field.onChange("");
                  }
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="reset" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="default">
            {t("transcribe")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
