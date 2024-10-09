import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Avatar,
  Button,
  Form,
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
  Textarea,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { ChatTTSForm } from "@renderer/components";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { useContext } from "react";
import { ChatAgentTypeEnum } from "@/types/enums";

export const ChatAgentForm = (props: {
  agent?: ChatAgentType;
  onFinish: () => void;
}) => {
  const { agent, onFinish } = props;
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const { currentTtsEngine } = useContext(AISettingsProviderContext);
  const agentFormSchema = z.object({
    type: z.enum([ChatAgentTypeEnum.GPT, ChatAgentTypeEnum.TTS]),
    name: z.string().min(1),
    description: z.string().min(1),
    config: z.object({
      prompt: z.string().optional(),
      tts: z
        .object({
          engine: z.string().optional(),
          model: z.string().optional(),
          language: z.string().optional(),
          voice: z.string().optional(),
        })
        .optional(),
    }),
  });

  const form = useForm<z.infer<typeof agentFormSchema>>({
    resolver: zodResolver(agentFormSchema),
    values: agent || {
      type: ChatAgentTypeEnum.GPT,
      name: "",
      description: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    const { type, name, description, config } = data;
    if (type === ChatAgentTypeEnum.TTS) {
      config.tts = {
        engine: config.tts?.engine || currentTtsEngine.name,
        model: config.tts?.model || currentTtsEngine.model,
        language: config.tts?.language || learningLanguage,
        voice: config.tts?.voice || currentTtsEngine.voice,
      };
    }

    if (agent?.id) {
      EnjoyApp.chatAgents
        .update(agent.id, {
          type,
          name,
          description,
          config,
        })
        .then(() => {
          toast.success(t("models.chatAgent.updated"));
          form.reset();
          onFinish();
        })
        .catch((error) => {
          toast.error(error.message);
        });
    } else {
      EnjoyApp.chatAgents
        .create({
          type,
          name,
          description,
          config,
        })
        .then(() => {
          toast.success(t("models.chatAgent.created"));
          form.reset();
          onFinish();
        })
        .catch((error) => {
          toast.error(error.message);
        });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="mb-4">{agent?.id ? t("editAgent") : t("newAgent")}</div>
        <div className="space-y-2 px-2 mb-6">
          {form.watch("name") && (
            <Avatar className="w-12 h-12 border">
              <img
                src={
                  agent?.avatarUrl ||
                  `https://api.dicebear.com/9.x/shapes/svg?seed=${form.watch(
                    "name"
                  )}`
                }
                alt={form.watch("name")}
              />
            </Avatar>
          )}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chatAgent.type")}</FormLabel>
                <Select
                  required
                  onValueChange={field.onChange}
                  value={field.value as string}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("models.chatAgent.type")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ChatAgentTypeEnum.GPT}>
                      {ChatAgentTypeEnum.GPT}
                    </SelectItem>
                    <SelectItem value={ChatAgentTypeEnum.TTS}>
                      {ChatAgentTypeEnum.TTS}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.watch("type") === ChatAgentTypeEnum.GPT && (
                  <FormDescription>
                    {t("models.chatAgent.typeGptDescription")}
                  </FormDescription>
                )}
                {form.watch("type") === ChatAgentTypeEnum.TTS && (
                  <FormDescription>
                    {t("models.chatAgent.typeTtsDescription")}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chatAgent.description")}</FormLabel>
                <Textarea
                  placeholder={t("models.chatAgent.descriptionPlaceholder")}
                  required
                  className="max-h-36"
                  {...field}
                />
                <FormDescription>
                  {t("models.chatAgent.descriptionDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("type") === ChatAgentTypeEnum.GPT && (
            <FormField
              control={form.control}
              name="config.prompt"
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
          )}

          {form.watch("type") === ChatAgentTypeEnum.TTS && (
            <ChatTTSForm form={form} />
          )}
        </div>
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="ghost" onClick={onFinish}>
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
