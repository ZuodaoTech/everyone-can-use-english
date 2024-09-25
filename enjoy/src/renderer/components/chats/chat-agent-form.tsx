import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Avatar,
  Button,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from "@renderer/components/ui";
import { t } from "i18next";

export const ChatAgentForm = (props: {
  agent?: ChatAgentType;
  onSave: (data: {
    name: string;
    introduction: string;
    config: any;
  }) => Promise<any>;
  onCancel: () => void;
}) => {
  const { agent, onSave, onCancel } = props;

  const agentFormSchema = z.object({
    name: z.string().min(1),
    introduction: z.string().min(1),
    prompt: z.string(),
  });

  const form = useForm<z.infer<typeof agentFormSchema>>({
    resolver: zodResolver(agentFormSchema),
    values: agent || {
      name: t("models.chatAgent.namePlaceholder"),
      introduction: t("models.chatAgent.introductionPlaceholder"),
      prompt: t("models.chatAgent.promptPlaceholder"),
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    const { name, introduction, ...config } = data;
    return onSave({
      name,
      introduction,
      config,
    }).then(() => {
      if (agent?.id) return;
      form.reset();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="mb-4">{agent?.id ? t("editAgent") : t("newAgent")}</div>
        <div className="space-y-2 px-2 mb-6">
          {form.watch("name") && (
            <Avatar className="w-12 h-12 border">
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${form.watch(
                  "name"
                )}`}
                alt={form.watch("name")}
              />
            </Avatar>
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chatAgent.name")}</FormLabel>
                <Input
                  placeholder={t("models.chatAgent.namePlaceholder")}
                  required
                  {...field}
                />
                <FormDescription>
                  {t("models.chatAgent.nameDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="introduction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chatAgent.introduction")}</FormLabel>
                <Textarea
                  placeholder={t("models.chatAgent.introductionPlaceholder")}
                  required
                  className="max-h-36"
                  {...field}
                />
                <FormDescription>
                  {t("models.chatAgent.introductionDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chatAgent.prompt")}</FormLabel>
                <Textarea
                  placeholder={t("models.chatAgent.promptPlaceholder")}
                  required
                  className="min-h-36 max-h-64"
                  {...field}
                />
                <FormDescription>
                  {t("models.chatAgent.promptDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit" onClick={onSubmit}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
