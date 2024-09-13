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
  FormMessage,
  Input,
  ScrollArea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  toast,
} from "@renderer/components/ui";
import { useState, useEffect, useContext } from "react";
import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { LoaderIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  GPT_PROVIDERS,
  TTS_PROVIDERS,
  GPTShareButton,
  ConversationFormGPT,
  ConversationFormTTS,
} from "@renderer/components";

export const ConversationForm = (props: {
  conversation: Partial<ConversationType>;
  onFinish?: () => void;
}) => {
  const { conversation, onFinish } = props;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [gptProviders, setGptProviders] = useState<any>(GPT_PROVIDERS);
  const [ttsProviders, setTtsProviders] = useState<any>(TTS_PROVIDERS);
  const { EnjoyApp, webApi, learningLanguage } = useContext(
    AppSettingsProviderContext
  );
  const { openai } = useContext(AISettingsProviderContext);
  const navigate = useNavigate();

  const conversationFormSchema = z.object({
    name: z.string().optional(),
    engine: z.enum(["enjoyai", "openai", "ollama"]).default("openai"),
    configuration: z.object({
      type: z.enum(["gpt", "tts"]),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
      roleDefinition: z.string().optional(),
      temperature: z.number().min(0).max(1).default(0.2),
      numberOfChoices: z.number().min(1).default(1),
      maxTokens: z.number().min(-1).default(2048),
      presencePenalty: z.number().min(-2).max(2).default(0),
      frequencyPenalty: z.number().min(-2).max(2).default(0),
      historyBufferSize: z.number().min(0).default(10),
      tts: z.object({
        language: z.string().default(learningLanguage).optional(),
        engine: z.enum(["openai", "enjoyai"]).default("enjoyai"),
        model: z.string().default("openai/tts-1"),
        voice: z.string(),
        baseUrl: z.string().optional(),
      }),
    }),
  });

  const refreshGptProviders = async () => {
    let providers = GPT_PROVIDERS;

    try {
      const config = await webApi.config("gpt_providers");
      providers = Object.assign(providers, config);
    } catch (e) {
      console.warn(`Failed to fetch remote GPT config: ${e.message}`);
    }

    try {
      const response = await fetch(providers["ollama"]?.baseUrl + "/api/tags");
      providers["ollama"].models = (await response.json()).models.map(
        (m: any) => m.name
      );
    } catch (e) {
      console.warn(`No ollama server found: ${e.message}`);
    }

    if (openai.models) {
      providers["openai"].models = openai.models.split(",");
    }

    setGptProviders({ ...providers });
  };

  const destroyConversation = async () => {
    if (!conversation.id) return;

    EnjoyApp.conversations.destroy(conversation.id).then(() => {
      navigate(`/conversations`);
    });
  };

  const refreshTtsProviders = async () => {
    let providers = TTS_PROVIDERS;

    try {
      const config = await webApi.config("tts_providers_v2");
      providers = Object.assign(providers, config);
    } catch (e) {
      console.warn(`Failed to fetch remote TTS config: ${e.message}`);
    }

    setTtsProviders({ ...providers });
  };

  useEffect(() => {
    refreshGptProviders();
    refreshTtsProviders();
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
    if (!defaultConfig.configuration.tts?.baseUrl) {
      defaultConfig.configuration.tts.baseUrl = openai.baseUrl;
    }
  }

  if (!defaultConfig.configuration.tts) {
    defaultConfig.configuration.tts = {};
  }

  if (!defaultConfig.configuration.tts.language) {
    defaultConfig.configuration.tts.language = learningLanguage;
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
    let { name, engine, configuration } = data;
    setSubmitting(true);

    try {
      configuration = validateConfiguration(data);
    } catch (e) {
      toast.error(e.message);
      setSubmitting(false);
      return;
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

  const validateConfiguration = (
    data: z.infer<typeof conversationFormSchema>
  ) => {
    const { engine, configuration } = data;

    Object.keys(configuration).forEach((key) => {
      if (key === "type") return;

      if (
        configuration.type === "gpt" &&
        !gptProviders[engine]?.configurable.includes(key)
      ) {
        // @ts-ignore
        delete configuration[key];
      }

      if (
        configuration.type === "tts" &&
        !ttsProviders[engine]?.configurable.includes(key)
      ) {
        // @ts-ignore
        delete configuration.tts[key];
      }
    });

    // use default base url if not set
    if (!configuration.baseUrl) {
      configuration.baseUrl = gptProviders[engine]?.baseUrl;
    }

    // use default base url if not set
    if (!configuration?.tts?.baseUrl) {
      configuration.tts ||= {};
      configuration.tts.baseUrl = gptProviders[engine]?.baseUrl;
    }

    // validates tts voice
    const ttsEngine = configuration.tts.engine;
    const voice = configuration.tts.voice;
    const language = configuration.tts.language;
    if (!language) {
      configuration.tts.language === learningLanguage;
    }
    if (!ttsEngine) {
      configuration.tts.engine = "openai";
    }
    if (!configuration.tts.model) {
      configuration.tts.model = "openai/tts-1";
    }

    if (ttsEngine === "openai") {
      const options = ttsProviders["openai"].voices;
      if (!options.includes(voice)) {
        configuration.tts.voice = options[0];
      }
    }
    if (ttsEngine === "enjoyai") {
      const model = configuration.tts.model.split("/")[0];
      const options = ttsProviders.enjoyai.voices[model];
      if (model === "openai" && !options.includes(voice)) {
        configuration.tts.voice = options[0];
      } else if (
        model === "azure" &&
        options.findIndex(
          (o: any) => o.language === language && o.value === voice
        ) < 0
      ) {
        configuration.tts.voice = options.find(
          (o: any) => o.language === language
        )?.value;
      }
    }

    return configuration;
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
              <ConversationFormGPT
                form={form}
                gptProviders={gptProviders}
                conversation={conversation}
              />
            )}

            <ConversationFormTTS form={form} ttsProviders={ttsProviders} />
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
