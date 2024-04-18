import * as z from "zod";
import { t } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
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
  FormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
  ScrollArea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
} from "@renderer/components/ui";
import { useState, useEffect, useContext } from "react";
import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { LoaderIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GPT_PROVIDERS, TTS_PROVIDERS, GPTShareButton } from "@renderer/components";

const conversationFormSchema = z.object({
  name: z.string().optional(),
  engine: z
    .enum(["enjoyai", "openai", "ollama", "googleGenerativeAi"])
    .default("openai"),
  configuration: z
    .object({
      type: z.enum(["gpt", "tts"]),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
      roleDefinition: z.string().optional(),
      temperature: z.number().min(0).max(1).default(0.2),
      numberOfChoices: z.number().min(1).default(1),
      maxTokens: z.number().min(-1).default(2000),
      presencePenalty: z.number().min(-2).max(2).default(0),
      frequencyPenalty: z.number().min(-2).max(2).default(0),
      historyBufferSize: z.number().min(0).default(10),
      tts: z
        .object({
          engine: z.enum(["openai", "enjoyai"]).default("openai"),
          model: z.string().default("tts-1"),
          voice: z.string().optional(),
          baseUrl: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const ConversationForm = (props: {
  conversation: Partial<ConversationType>;
  onFinish?: () => void;
}) => {
  const { conversation, onFinish } = props;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [providers, setProviders] = useState<any>(GPT_PROVIDERS);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);
  const navigate = useNavigate();

  const refreshProviders = async () => {
    try {
      const response = await fetch(providers["ollama"]?.baseUrl + "/api/tags");
      providers["ollama"].models = (await response.json()).models.map(
        (m: any) => m.name
      );
    } catch (e) {
      console.warn(`No ollama server found: ${e.message}`);
    }
    setProviders({ ...providers });
  };

  const destroyConversation = async () => {
    if (!conversation.id) return;

    EnjoyApp.conversations.destroy(conversation.id).then(() => {
      navigate(`/conversations`);
    });
  };

  useEffect(() => {
    refreshProviders();
  }, []);

  const defaultConfig = JSON.parse(JSON.stringify(conversation || {}));
  if (defaultConfig.engine === "openai" && openai) {
    if (!defaultConfig.configuration) {
      defaultConfig.configuration = {};
    }
    if (!defaultConfig.configuration.model) {
      defaultConfig.configuration.model = openai.model;
    }
    if (!defaultConfig.configuration.baseUrl) {
      defaultConfig.configuration.baseUrl = openai.baseUrl;
    }
  }

  if (defaultConfig.configuration.tts?.engine === "openai" && openai) {
    if (!defaultConfig.configuration.tts.baseUrl) {
      defaultConfig.configuration.tts.baseUrl = openai.baseUrl;
    }
  }

  const form = useForm<z.infer<typeof conversationFormSchema>>({
    resolver: zodResolver(conversationFormSchema),
    // @ts-ignore
    values: conversation?.id
      ? {
          name: conversation.name,
          engine: conversation.engine,
          configuration: {
            type: conversation.configuration.type || "gpt",
            ...conversation.configuration,
          },
        }
      : {
          name: defaultConfig.name,
          engine: defaultConfig.engine,
          configuration: {
            ...defaultConfig.configuration,
          },
        },
  });

  const onSubmit = async (data: z.infer<typeof conversationFormSchema>) => {
    const { name, engine, configuration } = data;
    setSubmitting(true);

    Object.keys(configuration).forEach((key) => {
      if (key === "type") return;

      if (!GPT_PROVIDERS[engine]?.configurable.includes(key)) {
        // @ts-ignore
        delete configuration[key];
      }
    });

    if (configuration.type === "tts") {
      conversation.model = configuration.tts.model;
    }

    // use default base url if not set
    if (!configuration.baseUrl) {
      configuration.baseUrl = GPT_PROVIDERS[engine]?.baseUrl;
    }

    // use default base url if not set
    if (!configuration.tts.baseUrl) {
      configuration.tts.baseUrl = GPT_PROVIDERS[engine]?.baseUrl;
    }

    if (conversation?.id) {
      EnjoyApp.conversations
        .update(conversation.id, {
          name,
          configuration,
        })
        .then(() => {
          onFinish && onFinish();
        })
        .finally(() => {
          setSubmitting(false);
        });
    } else {
      EnjoyApp.conversations
        .create({
          name,
          engine,
          configuration,
        })
        .then(() => {
          onFinish && onFinish();
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full flex flex-col pt-6"
        data-testid="conversation-form"
      >
        <div className="mb-4 px-6 flex items-center space-x-4">
          <div className="text-lg font-bold">
            {conversation.id ? t("editConversation") : t("startConversation")}
          </div>
          <GPTShareButton conversation={conversation} />
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 px-2 mb-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("models.conversation.name")}</FormLabel>
                  <Input value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="configuration.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("models.conversation.type")}</FormLabel>
                  <Select
                    disabled={Boolean(conversation?.id)}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectAiType")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem key="gpt" value="gpt">
                        GPT
                      </SelectItem>
                      <SelectItem key="tts" value="tts">
                        TTS
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("configuration.type") === "gpt" && (
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
                          {Object.keys(providers)
                            .filter((key) =>
                              GPT_PROVIDERS[key].types.includes(
                                form.watch("configuration.type")
                              )
                            )
                            .map((key) => (
                              <SelectItem key={key} value={key}>
                                {providers[key].name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {providers[form.watch("engine")]?.description}
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectAiModel")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(providers[form.watch("engine")]?.models || []).map(
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
                      <FormLabel>
                        {t("models.conversation.roleDefinition")}
                      </FormLabel>
                      <Textarea
                        placeholder={t(
                          "models.conversation.roleDefinitionPlaceholder"
                        )}
                        className="h-64"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {GPT_PROVIDERS[form.watch("engine")]?.configurable.includes(
                  "temperature"
                ) && (
                  <FormField
                    control={form.control}
                    name="configuration.temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("models.conversation.temperature")}
                        </FormLabel>
                        <Input
                          type="number"
                          min="0"
                          max="1.0"
                          step="0.1"
                          value={field.value}
                          onChange={(event) => {
                            field.onChange(
                              event.target.value
                                ? parseFloat(event.target.value)
                                : 0.0
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

                {GPT_PROVIDERS[form.watch("engine")]?.configurable.includes(
                  "maxTokens"
                ) && (
                  <FormField
                    control={form.control}
                    name="configuration.maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("models.conversation.maxTokens")}
                        </FormLabel>
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

                {GPT_PROVIDERS[form.watch("engine")]?.configurable.includes(
                  "presencePenalty"
                ) && (
                  <FormField
                    control={form.control}
                    name="configuration.presencePenalty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("models.conversation.presencePenalty")}
                        </FormLabel>
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

                {GPT_PROVIDERS[form.watch("engine")]?.configurable.includes(
                  "frequencyPenalty"
                ) && (
                  <FormField
                    control={form.control}
                    name="configuration.frequencyPenalty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("models.conversation.frequencyPenalty")}
                        </FormLabel>
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

                {GPT_PROVIDERS[form.watch("engine")]?.configurable.includes(
                  "numberOfChoices"
                ) && (
                  <FormField
                    control={form.control}
                    name="configuration.numberOfChoices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("models.conversation.numberOfChoices")}
                        </FormLabel>
                        <Input
                          type="number"
                          min="1"
                          step="1.0"
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
                      <FormLabel>
                        {t("models.conversation.historyBufferSize")}
                      </FormLabel>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        max="100"
                        value={field.value}
                        onChange={(event) => {
                          field.onChange(
                            event.target.value
                              ? parseInt(event.target.value)
                              : 0
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

                {GPT_PROVIDERS[form.watch("engine")]?.configurable.includes(
                  "baseUrl"
                ) && (
                  <FormField
                    control={form.control}
                    name="configuration.baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("models.conversation.baseUrl")}
                        </FormLabel>
                        <Input
                          {...field}
                          placeholder={t(
                            "models.conversation.baseUrlDescription"
                          )}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <FormField
              control={form.control}
              name="configuration.tts.engine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("models.conversation.ttsEngine")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectTtsEngine")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(TTS_PROVIDERS).map((key) => (
                        <SelectItem key={key} value={key}>
                          {TTS_PROVIDERS[key].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {TTS_PROVIDERS[
              form.watch("configuration.tts.engine")
            ]?.configurable.includes("model") && (
              <FormField
                control={form.control}
                name="configuration.tts.model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("models.conversation.ttsModel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTtsModel")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          TTS_PROVIDERS[form.watch("configuration.tts.engine")]
                            ?.models || []
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
            )}

            {TTS_PROVIDERS[
              form.watch("configuration.tts.engine")
            ]?.configurable.includes("voice") && (
              <FormField
                control={form.control}
                name="configuration.tts.voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("models.conversation.ttsVoice")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTtsVoice")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          TTS_PROVIDERS[form.watch("configuration.tts.engine")]
                            ?.voices || []
                        ).map((voice: string) => (
                          <SelectItem key={voice} value={voice}>
                            <span className="capitalize">{voice}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {TTS_PROVIDERS[
              form.watch("configuration.tts.engine")
            ]?.configurable.includes("baseUrl") && (
              <FormField
                control={form.control}
                name="configuration.tts.baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("models.conversation.ttsBaseUrl")}</FormLabel>
                    <Input
                      {...field}
                      placeholder={t(
                        "models.conversation.ttsBaseUrlDescription"
                      )}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-center space-x-4 py-6 px-6 border-t shadow">
          {conversation.id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full h-12 text-destructive"
                  size="lg"
                  variant="secondary"
                >
                  {t("delete")}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteConversation")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                  {t("deleteConversationConfirmation")}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive-hover"
                    onClick={destroyConversation}
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            disabled={
              submitting || (conversation.id && !form.formState.isDirty)
            }
            className="w-full h-12"
            data-testid="conversation-form-submit"
            size="lg"
            type="submit"
          >
            {submitting && <LoaderIcon className="mr-2 animate-spin" />}
            {t("confirm")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
