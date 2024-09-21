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

export const ChatForm = (props: { chat?: ChatType; onFinish?: () => void }) => {
  const { chat, onFinish } = props;
  const { sttEngine } = useContext(AISettingsProviderContext);
  const { user } = useContext(AppSettingsProviderContext);
  const { currentChatAgent, createChat, updateChat, destroyChat } =
    useContext(ChatProviderContext);
  const [members, setMembers] = useState<
    Array<{
      agent: ChatAgentType;
      userId?: string;
      userType?: "User" | "Agent";
      config: {
        prompt?: string;
        introduction?: string;
        gpt?: GptConfigType;
        tts?: TtsConfigType;
      };
    }>
  >(
    (
      chat?.members || [
        {
          userId: user.id.toString(),
          userType: "User",
          name: user.name,
          config: {},
        },
        {
          agent: currentChatAgent,
          userId: currentChatAgent.id,
          userType: "Agent",
          name: currentChatAgent.name,
          config: {
            prompt: "",
            gpt: {
              engine: "enjoyai",
              model: "gpt-4o",
              temperature: 0.5,
            },
            tts: {
              engine: "enjoyai",
              model: "openai/tts-1",
              language: "en-US",
              voice: "alloy",
            },
          },
        },
      ]
    )
      .filter((member) => member.userType === "Agent")
      .map((member) => ({
        agent: member.agent,
        userId: member.userId,
        userType: member.userType,
        name: member.name,
        config: {
          prompt: member.config.prompt,
          gpt: member.config.gpt as GptConfigType,
          tts: member.config.tts as TtsConfigType,
        },
      })) || []
  );

  const chatFormSchema = z.object({
    name: z.string().min(1),
    topic: z.string(),
    config: z.object({
      sttEngine: z.string().default(sttEngine),
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
        },
      }).then(() => onFinish());
    } else {
      createChat({
        name,
        topic,
        members,
        config: {
          sttEngine: config.sttEngine,
        },
      }).then(() => onFinish());
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Tabs defaultValue="basic" className="mb-6">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">{t("basic")}</TabsTrigger>
            <TabsTrigger value="advanced">{t("advanced")}</TabsTrigger>
            <TabsTrigger value="members">{t("members")}</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
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
          </TabsContent>
          <TabsContent value="advanced">
            <FormField
              control={form.control}
              name="config.sttEngine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sttAiService")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
                      <SelectItem value={SttEngineOptionEnum.ENJOY_CLOUDFLARE}>
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
          </TabsContent>
          <TabsContent value="members">
            <Tabs defaultValue={members[0]?.userId}>
              <TabsList>
                {members.map((member) => (
                  <TabsTrigger value={member.userId}>
                    {member.agent.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {members.map((member) => (
                <TabsContent key={member.userId} value={member.userId}>
                  <ChatMemberForm
                    member={member}
                    onSave={(data) => console.log(data)}
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
