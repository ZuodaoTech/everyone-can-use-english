import { t } from "i18next";
import { Button, toast, Form } from "@renderer/components/ui";
import { AISettingsProviderContext } from "@renderer/context";
import { useContext, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TTSForm } from "@renderer/components";

const ttsConfigSchema = z.object({
  config: z.object({
    tts: z.object({
      engine: z.string().min(1),
      model: z.string().min(1),
      language: z.string().min(1),
      voice: z.string().min(1),
    }),
  }),
});

export const TtsSettings = () => {
  const [editing, setEditing] = useState(false);
  const { ttsConfig, setTtsConfig } = useContext(AISettingsProviderContext);
  const form = useForm<z.infer<typeof ttsConfigSchema>>({
    resolver: zodResolver(ttsConfigSchema),
    values: {
      config: {
        tts: ttsConfig,
      },
    },
  });

  const onSubmit = (data: z.infer<typeof ttsConfigSchema>) => {
    setTtsConfig(data.config.tts as TtsConfigType)
      .then(() => toast.success(t("saved")))
      .finally(() => setEditing(false));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between py-4">
          <div className="">
            <div className="flex items-center mb-2">
              <span>{t("ttsService")}</span>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              {form.watch("config.tts.engine") === "openai"
                ? t("openaiTtsServiceDescription")
                : t("enjoyTtsServiceDescription")}
            </div>
            <div
              className={`text-sm text-muted-foreground space-y-3 px-1 ${
                editing ? "" : "hidden"
              }`}
            >
              <TTSForm form={form} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={editing ? "outline" : "secondary"}
              size="sm"
              type="reset"
              onClick={(event) => {
                event.preventDefault();
                form.reset();
                setEditing(!editing);
              }}
            >
              {editing ? t("cancel") : t("edit")}
            </Button>
            <Button className={editing ? "" : "hidden"} size="sm" type="submit">
              {t("save")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
