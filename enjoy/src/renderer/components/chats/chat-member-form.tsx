import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
  Slider,
  Textarea,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext } from "react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { LANGUAGES } from "@/constants";
import Mustache from "mustache";

export const ChatMemberForm = (props: {
  chat: ChatType;
  member: Partial<ChatMemberType>;
  onFinish?: () => void;
}) => {
  const { member, onFinish, chat } = props;
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const { gptProviders, ttsProviders, currentGptEngine, currentTtsEngine } =
    useContext(AISettingsProviderContext);

  const buildFullPrompt = (prompt: string) => {
    return Mustache.render(
      `{{{agent_prompt}}}
      {{{chat_prompt}}}
      {{{member_prompt}}}`,
      {
        agent_prompt: member.agent.prompt,
        chat_prompt: chat.config.prompt,
        member_prompt: prompt,
      }
    ).trim();
  };

  const buildMember = (agent: ChatAgentType): Partial<ChatMemberType> => {
    return {
      agent,
      userId: agent.id,
      userType: "ChatAgent",
      name: agent.name,
      config: {
        gpt: {
          engine: currentGptEngine.name,
          model: currentGptEngine.models.default,
          temperature: 0.5,
        },
        tts: {
          engine: currentTtsEngine.name,
          model: currentTtsEngine.model,
          voice: currentTtsEngine.voice,
          language: learningLanguage,
        },
      },
    };
  };
  const chatMemberFormSchema = z.object({
    userId: z.string(),
    userType: z.enum(["User", "ChatAgent"]).default("ChatAgent"),
    config: z.object({
      prompt: z.string().optional(),
      introduction: z.string().optional(),
      gpt: z.object({
        engine: z.string(),
        model: z.string(),
        temperature: z.number(),
        maxTokens: z.number().optional(),
        frequencyPenalty: z.number().optional(),
        presencePenalty: z.number().optional(),
        numberOfChoices: z.number().optional(),
        historyBufferSize: z.number().optional(),
      }),
      tts: z.object({
        engine: z.string(),
        model: z.string(),
        voice: z.string(),
        language: z.string(),
      }),
    }),
  });

  const form = useForm<z.infer<typeof chatMemberFormSchema>>({
    resolver: zodResolver(chatMemberFormSchema),
    values: member,
  });

  const onSubmit = form.handleSubmit(
    (data: z.infer<typeof chatMemberFormSchema>) => {
      if (member?.id) {
        EnjoyApp.chatMembers
          .update(member.id, data)
          .then(() => {
            toast.success(t("chatMemberUpdated"));
            onFinish?.();
          })
          .catch((error) => {
            toast.error(error.message);
          });
      } else {
        EnjoyApp.chatMembers
          .create(data)
          .then(() => {
            toast.success(t("chatMemberAdded"));
            onFinish?.();
          })
          .catch((error) => {
            toast.error(error.message);
          });
      }
    }
  );

  const handleDelete = () => {
    EnjoyApp.chatMembers
      .destroy(member.id)
      .then(() => {
        toast.success(t("chatMemberDeleted"));
        onFinish?.();
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  if (!member) return null;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Accordion
          defaultValue="gpt"
          type="single"
          collapsible
          className="mb-6"
        >
          <AccordionItem value="gpt">
            <AccordionTrigger className="text-muted-foreground">
              {t("models.chatMember.gptSettings")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 px-2">
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
                          gptProviders[
                            form.watch("config.gpt.engine") as string
                          ]?.models || []
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
                    <FormDescription>
                      {t("gpt.temperatureDescription")}
                    </FormDescription>
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
                        defaultValue={[10]}
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
                name="config.gpt.maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("gpt.maxTokens")}</FormLabel>
                    <Input
                      type="number"
                      min="-1"
                      defaultValue={-1}
                      value={field.value}
                      onChange={(event) => {
                        if (!event.target.value) return;
                        field.onChange(parseInt(event.target.value));
                      }}
                    />
                    <FormDescription>
                      {t("gpt.maxTokensDescription")}
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
                        defaultValue={[1]}
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
                        defaultValue={[1]}
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
                      defaultValue={1}
                      value={field.value}
                      onChange={(event) => {
                        field.onChange(
                          event.target.value
                            ? parseInt(event.target.value)
                            : 1.0
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tts">
            <AccordionTrigger className="text-muted-foreground">
              {t("models.chatMember.ttsSettings")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 px-2">
              <FormField
                control={form.control}
                name="config.tts.engine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tts.engine")}</FormLabel>
                    <Select
                      required
                      onValueChange={field.onChange}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTtsEngine")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(ttsProviders).map((key) => (
                          <SelectItem key={key} value={key}>
                            {ttsProviders[key].name}
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
                name="config.tts.model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tts.model")}</FormLabel>
                    <Select
                      required
                      onValueChange={field.onChange}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTtsModel")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          ttsProviders[
                            form.watch("config.tts.engine") as string
                          ]?.models || []
                        ).map((model: string) => (
                          <SelectItem key={model} value={model}>
                            {model}
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
                name="config.tts.language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tts.language")}</FormLabel>
                    <Select
                      required
                      value={field.value as string}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue>
                          {
                            LANGUAGES.find((lang) => lang.code === field.value)
                              ?.name
                          }
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.tts.voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tts.voice")}</FormLabel>
                    <Select
                      required
                      onValueChange={field.onChange}
                      defaultValue={field.value as string}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTtsVoice")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          (form.watch("config.tts.engine") === "enjoyai"
                            ? ttsProviders.enjoyai.voices[
                                (
                                  form.watch("config.tts.model") as string
                                )?.split("/")?.[0]
                              ]
                            : ttsProviders[
                                form.watch("config.tts.engine") as string
                              ]?.voices) || []
                        ).map((voice: any) => {
                          if (typeof voice === "string") {
                            return (
                              <SelectItem key={voice} value={voice}>
                                <span className="capitalize">{voice}</span>
                              </SelectItem>
                            );
                          } else if (
                            voice.language === form.watch("config.tts.language")
                          ) {
                            return (
                              <SelectItem key={voice.value} value={voice.value}>
                                <span className="capitalize">
                                  {voice.label}
                                </span>
                              </SelectItem>
                            );
                          }
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="more">
            <AccordionTrigger className="text-muted-foreground">
              {t("models.chatMember.moreSettings")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 px-2">
              <FormField
                control={form.control}
                name="config.prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("models.chatMember.prompt")}</FormLabel>
                    <Textarea
                      placeholder={t("models.chatMember.promptPlaceholder")}
                      className="max-h-48"
                      {...field}
                    />
                    <FormDescription>
                      {t("models.chatMember.promptDescription")}
                    </FormDescription>
                    <FormMessage />
                    <div className="text-sm text-muted-foreground mb-2">
                      {t("promptPreview")}:
                    </div>
                    <div className="text-muted-foreground bg-muted px-4 py-2 rounded-md">
                      <div className="font-serif select-text text-sm whitespace-pre-line">
                        {buildFullPrompt(form.watch("config.prompt"))}
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center justify-end space-x-4 w-full">
          {member?.id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="text-destructive" variant="secondary">
                  {t("delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteChatMember")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                  {t("deleteChatMemberConfirmation")}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive-hover"
                    onClick={handleDelete}
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Form>
  );
};
