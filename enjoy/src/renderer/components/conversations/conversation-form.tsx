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
import { AppSettingsProviderContext } from "@renderer/context";
import { LoaderIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const conversationFormSchema = z.object({
  name: z.string().optional(),
  engine: z.enum(["openai", "ollama", "googleGenerativeAi"]).default("openai"),
  configuration: z
    .object({
      model: z.string().nonempty(),
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
          engine: z.enum(["openai"]).default("openai"),
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
  const [providers, setProviders] = useState<any>(LLM_PROVIDERS);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const navigate = useNavigate();

  const refreshProviders = async () => {
    try {
      const response = await fetch(providers["ollama"]?.baseUrl + "/api/tags");
      providers["ollama"].models = (await response.json()).models.map(
        (m: any) => m.name
      );
    } catch (e) {
      console.error(e);
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

  const form = useForm<z.infer<typeof conversationFormSchema>>({
    resolver: zodResolver(conversationFormSchema),
    // @ts-ignore
    values: conversation?.id
      ? {
          name: conversation.name,
          engine: conversation.engine,
          configuration: {
            ...conversation.configuration,
            tts: {
              ...conversation.configuration?.tts,
            },
          },
        }
      : {
          name: conversationDefaultConfiguration.name,
          engine: conversationDefaultConfiguration.engine,
          configuration: {
            ...conversationDefaultConfiguration.configuration,
          },
        },
  });

  const onSubmit = async (data: z.infer<typeof conversationFormSchema>) => {
    const { name, engine, configuration } = data;
    setSubmitting(true);

    Object.keys(configuration).forEach((key) => {
      if (!LLM_PROVIDERS[engine]?.configurable.includes(key)) {
        // @ts-ignore
        delete configuration[key];
      }
    });

    if (!configuration.baseUrl) {
      configuration.baseUrl = LLM_PROVIDERS[engine]?.baseUrl;
    }

    if (!configuration.tts.baseUrl) {
      configuration.tts.baseUrl = LLM_PROVIDERS[engine]?.baseUrl;
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
      >
        <div className="mb-4 px-6 text-lg font-bold">
          {conversation.id ? t("editConversation") : t("startConversation")}
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
                      {Object.keys(providers).map((key) => (
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Textarea className="h-64" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            {LLM_PROVIDERS[form.watch("engine")]?.configurable.includes(
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

            {LLM_PROVIDERS[form.watch("engine")]?.configurable.includes(
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

            {LLM_PROVIDERS[form.watch("engine")]?.configurable.includes(
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

            {LLM_PROVIDERS[form.watch("engine")]?.configurable.includes(
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

            {LLM_PROVIDERS[form.watch("engine")]?.configurable.includes(
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

            {LLM_PROVIDERS[form.watch("engine")]?.configurable.includes(
              "baseUrl"
            ) && (
              <FormField
                control={form.control}
                name="configuration.baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("models.conversation.baseUrl")}</FormLabel>
                    <Input {...field} />
                    <FormDescription>
                      {t("models.conversation.baseUrl")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            <FormField
              control={form.control}
              name="configuration.tts.baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("models.conversation.ttsBaseUrl")}</FormLabel>
                  <Input {...field} />
                  <FormDescription>
                    {t("models.conversation.baseUrl")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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

export const LLM_PROVIDERS: { [key: string]: any } = {
  openai: {
    name: "OpenAI",
    description: t("youNeedToSetupApiKeyBeforeUsingOpenAI"),
    models: [
      "gpt-3.5-turbo-1106",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-3.5-turbo-instruct",
      "gpt-4-1106-preview",
      "gpt-4-vision-preview",
      "gpt-4",
      "gpt-4-32k",
      "gpt-4-0613",
      "gpt-4-32k-0613",
    ],
    configurable: [
      "model",
      "baseUrl",
      "roleDefinition",
      "temperature",
      "numberOfChoices",
      "maxTokens",
      "frequencyPenalty",
      "presencePenalty",
      "historyBufferSize",
      "tts",
    ],
  },
  googleGenerativeAi: {
    name: "Google Generative AI",
    models: ["gemini-pro"],
    configurable: [
      "model",
      "roleDefinition",
      "temperature",
      "maxTokens",
      "historyBufferSize",
      "tts",
    ],
  },
  ollama: {
    name: "Ollama",
    description: t("ensureYouHaveOllamaRunningLocallyAndHasAtLeastOneModel"),
    baseUrl: "http://localhost:11434",
    models: [],
    configurable: [
      "model",
      "baseUrl",
      "roleDefinition",
      "temperature",
      "maxTokens",
      "historyBufferSize",
      "frequencyPenalty",
      "presencePenalty",
      "tts",
    ],
  },
};

export const TTS_PROVIDERS: { [key: string]: any } = {
  openai: {
    name: "OpenAI",
    description: t("youNeedToSetupApiKeyBeforeUsingOpenAI"),
    models: ["tts-1"],
    voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
  },
};

const conversationDefaultConfiguration = {
  name: "英语教练",
  engine: "openai",
  configuration: {
    model: "gpt-4-1106-preview",
    roleDefinition: `你是我的英语教练。
请将我的话改写成英文。
不需要逐字翻译。
请分析清楚我的内容，而后用英文重新逻辑清晰地组织它。
请使用地道的美式英语，纽约腔调。
请尽量使用日常词汇，尽量优先使用短语动词或者习惯用语。
每个句子最长不应该超过 20 个单词。`,
    temperature: 0.2,
    numberOfChoices: 1,
    maxTokens: 2048,
    presencePenalty: 0,
    frequencyPenalty: 0,
    historyBufferSize: 0,
    tts: {
      baseUrl: "",
      engine: "openai",
      model: "tts-1",
      voice: "alloy",
    },
  },
};
