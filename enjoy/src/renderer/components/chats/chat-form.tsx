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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useState } from "react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  ChatProviderContext,
} from "@renderer/context";
import { SttEngineOptionEnum } from "@/types/enums";
import { ChatMemberForm } from "./chat-member-form";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export const ChatForm = (props: { chat?: ChatType; onFinish?: () => void }) => {
  const { chat, onFinish } = props;
  const { sttEngine, currentGptEngine, currentTtsEngine } = useContext(
    AISettingsProviderContext
  );
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const [isMoreSettingsOpen, setIsMoreSettingsOpen] = useState(false);
  const { currentChatAgent, createChat, updateChat, destroyChat } =
    useContext(ChatProviderContext);
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
  const [members, setMembers] = useState<
    Array<{
      agent: ChatAgentType;
      userId: string;
      userType: "User" | "ChatAgent";
      config: {
        prompt?: string;
        gpt?: GptConfigType;
        tts?: TtsConfigType;
      };
    }>
  >(
    (
      chat?.members?.filter((member) => member.userType === "ChatAgent") || [
        buildMember(currentChatAgent),
      ]
    ).map((member) => ({
      agent: member.agent,
      userId: member.userId,
      userType: member.userType,
      name: member.name,
      config: {
        prompt: member.config.prompt,
        gpt: member.config.gpt as GptConfigType,
        tts: {
          language: member.config.tts?.language || learningLanguage,
          ...member.config.tts,
        } as TtsConfigType,
      },
    })) || []
  );

  const chatFormSchema = z.object({
    name: z.string().min(1),
    topic: z.string(),
    config: z.object({
      sttEngine: z.string().default(sttEngine),
      prompt: z.string().optional(),
    }),
  });

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    values: chat?.id
      ? {
          name: chat.name,
          topic: chat.topic,
          config: chat.config,
        }
      : {
          name: t("newChat"),
          config: {
            sttEngine,
            prompt: "",
          },
        },
  });

  const onSubmit = form.handleSubmit((data) => {
    const { name, topic, config } = data;
    if (chat?.id) {
      updateChat(chat.id, {
        name,
        topic,
        members,
        config: {
          sttEngine: config.sttEngine,
          prompt: config.prompt,
        },
      }).then(() => onFinish());
    } else {
      createChat({
        name,
        topic,
        members,
        config: {
          sttEngine: config.sttEngine,
          prompt: config.prompt,
        },
      }).then(() => onFinish());
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Tabs defaultValue="basic" className="mb-6">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="basic">
              {t("models.chat.chatSettings")}
            </TabsTrigger>
            <TabsTrigger value="members">
              {t("models.chat.memberSettings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <div className="space-y-4 px-2 mb-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("models.chat.name")}</FormLabel>
                    <Input {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Collapsible open={isMoreSettingsOpen}>
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
                          <SelectValue />
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
                      <Textarea {...field} />
                      <FormDescription>
                        {t("models.chat.promptDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          <TabsContent value="members">
            <Tabs defaultValue={members[0]?.userId}>
              <TabsList>
                {members.map((member) => (
                  <TabsTrigger key={member.userId} value={member.userId}>
                    {member.agent.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {members.map((member) => (
                <TabsContent key={member.userId} value={member.userId}>
                  <ChatMemberForm
                    member={member}
                    onSave={(data) => {
                      setMembers(
                        members.map((m) =>
                          m.userId === data.userId ? { ...m, ...data } : m
                        ) as {
                          agent: ChatAgentType;
                          userId: string;
                          userType: "User" | "ChatAgent";
                          config: {
                            language: string;
                            prompt?: string;
                            gpt: GptConfigType;
                            tts: TtsConfigType;
                          };
                        }[]
                      );
                    }}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>

        <div className="flex items-center space-x-4 w-full">
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
                    onClick={() => {
                      destroyChat(chat.id).then(() => onFinish());
                    }}
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button>{t("save")}</Button>
        </div>
      </form>
    </Form>
  );
};
