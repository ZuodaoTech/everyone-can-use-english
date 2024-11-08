import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Form,
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
  Switch,
  Textarea,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useState } from "react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import {
  ChatMessageRoleEnum,
  ChatTypeEnum,
  SttEngineOptionEnum,
} from "@/types/enums";
import { ChevronDownIcon, ChevronUpIcon, RefreshCwIcon } from "lucide-react";
import { useAiCommand } from "@renderer/hooks";
import { cn } from "@renderer/lib/utils";

export const ChatForm = (props: { chat: ChatType; onFinish?: () => void }) => {
  const { chat, onFinish } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { sttEngine } = useContext(AISettingsProviderContext);
  const { summarizeTopic } = useAiCommand();
  const [isMoreSettingsOpen, setIsMoreSettingsOpen] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const chatFormSchema = z.object({
    name: z.string().min(1),
    config: z.object({
      sttEngine: z.string().default(sttEngine),
      prompt: z.string().optional(),
      enableChatAssistant: z.boolean().default(false),
      enableAutoTts: z.boolean().default(false),
    }),
  });

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    values: chat?.id
      ? {
          name: chat.name,
          config: chat.config,
        }
      : {
          name: t("newChat"),
          config: {
            sttEngine,
            prompt: "",
            enableChatAssistant: true,
            enableAutoTts: true,
          },
        },
  });

  const onSubmit = form.handleSubmit((data) => {
    const { name, config } = data;
    EnjoyApp.chats
      .update(chat.id, {
        name,
        config: {
          sttEngine: config.sttEngine,
          prompt: config.prompt,
          enableChatAssistant: config.enableChatAssistant,
          enableAutoTts: config.enableAutoTts,
        },
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .then(() => {
        onFinish();
      });
  });

  const handleDeleteChat = () => {
    EnjoyApp.chats
      .destroy(chat.id)
      .then(() => {
        onFinish();
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const generateTopic = async () => {
    setIsGeneratingTopic(true);
    try {
      let messages = await EnjoyApp.chatMessages.findAll({
        where: { chatId: chat.id },
        order: [["createdAt", "ASC"]],
      });
      messages = messages.filter(
        (m) =>
          m.role === ChatMessageRoleEnum.AGENT ||
          m.role === ChatMessageRoleEnum.USER
      );
      if (messages.length < 1) {
        toast.warning(t("chatNoContentYet"));
        return;
      }
      const content = messages
        .slice(0, 10)
        .map((m) => m.content)
        .join("\n");

      return await summarizeTopic(content);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="space-y-4 px-2 mb-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chat.name")}</FormLabel>
                <div className="flex items-center space-x-2 justify-between">
                  <Input className="flex-1" {...field} />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isGeneratingTopic}
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("models.chat.generateTopic")}
                    onClick={async () => {
                      if (isGeneratingTopic) return;
                      const topic = await generateTopic();
                      if (!topic) return;

                      field.onChange(topic);
                    }}
                  >
                    <RefreshCwIcon
                      className={cn(
                        "w-4 h-4",
                        isGeneratingTopic && "animate-spin"
                      )}
                    />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {[ChatTypeEnum.CONVERSATION, ChatTypeEnum.GROUP].includes(
            chat.type
          ) && (
            <>
              <FormField
                control={form.control}
                name="config.enableChatAssistant"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel>
                        {t("models.chat.enableChatAssistant")}
                      </FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                    <FormDescription>
                      {t("models.chat.enableChatAssistantDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="config.enableAutoTts"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel>{t("models.chat.enableAutoTts")}</FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                    <FormDescription>
                      {t("models.chat.enableAutoTtsDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {[ChatTypeEnum.CONVERSATION, ChatTypeEnum.GROUP].includes(
          chat.type
        ) && (
          <>
            <Collapsible open={isMoreSettingsOpen} className="mb-6">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="link"
                  className="w-full justify-center text-muted-foreground"
                  size="sm"
                  onClick={() => setIsMoreSettingsOpen(!isMoreSettingsOpen)}
                >
                  {t("models.chat.moreSettings")}
                  {isMoreSettingsOpen ? (
                    <ChevronUpIcon className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 px-2">
                <FormField
                  control={form.control}
                  name="config.sttEngine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("sttAiService")}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "models.chat.sttAiServicePlaceholder"
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SttEngineOptionEnum.LOCAL}>
                            {t("local")}
                          </SelectItem>
                          <SelectItem value={SttEngineOptionEnum.ENJOY_AZURE}>
                            {t("enjoyAzure")}
                          </SelectItem>
                          <SelectItem
                            value={SttEngineOptionEnum.ENJOY_CLOUDFLARE}
                          >
                            {t("enjoyCloudflare")}
                          </SelectItem>
                          <SelectItem value={SttEngineOptionEnum.OPENAI}>
                            {t("openai")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("models.chat.sttAiServiceDescription")}
                      </FormDescription>
                      <FormDescription>
                        {form.watch("config.sttEngine") ===
                          SttEngineOptionEnum.LOCAL &&
                          t("localSpeechToTextDescription")}
                        {form.watch("config.sttEngine") ===
                          SttEngineOptionEnum.ENJOY_AZURE &&
                          t("enjoyAzureSpeechToTextDescription")}
                        {form.watch("config.sttEngine") ===
                          SttEngineOptionEnum.ENJOY_CLOUDFLARE &&
                          t("enjoyCloudflareSpeechToTextDescription")}
                        {form.watch("config.sttEngine") ===
                          SttEngineOptionEnum.OPENAI &&
                          t("openaiSpeechToTextDescription")}
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("models.chat.prompt")}</FormLabel>
                      <Textarea
                        {...field}
                        placeholder={t("models.chat.promptPlaceholder")}
                      />
                      <FormDescription>
                        {t("models.chat.promptDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        <div className="flex items-center justify-end space-x-4 w-full">
          {chat?.id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="text-destructive" variant="secondary">
                  {t("delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteChat")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                  {t("deleteChatConfirmation")}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive-hover"
                    onClick={handleDeleteChat}
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="button" variant="secondary" onClick={onFinish}>
            {t("cancel")}
          </Button>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Form>
  );
};
