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
  Avatar,
  AvatarFallback,
  Button,
  Checkbox,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useState } from "react";
import { CheckCircleIcon } from "lucide-react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  ChatProviderContext,
} from "@renderer/context";
import { CHAT_SYSTEM_PROMPT_TEMPLATE, LANGUAGES } from "@/constants";
import Mustache from "mustache";
import { SttEngineOptionEnum } from "@/types/enums";

export const ChatForm = (props: {
  chat?: ChatType;
  onDestroy?: () => void;
  onCancel?: () => void;
  onFinish?: () => void;
}) => {
  const { chat, onFinish } = props;
  const { user, learningLanguage, nativeLanguage } = useContext(
    AppSettingsProviderContext
  );
  const { sttEngine } = useContext(AISettingsProviderContext);
  const { chatAgents, createChat, updateChat, destroyChat } =
    useContext(ChatProviderContext);
  const [editingMember, setEditingMember] =
    useState<Partial<ChatMemberType> | null>();

  const chatFormSchema = z.object({
    name: z.string().min(1),
    topic: z.string(),
    config: z.object({
      sttEngine: z.string().default(sttEngine),
    }),
    members: z
      .array(
        z.object({
          userId: z.string(),
          userType: z.enum(["User", "Agent"]).default("Agent"),
          config: z.object({
            prompt: z.string().optional(),
            introduction: z.string().optional(),
            gpt: z.object({} as GptConfigType),
            tts: z.object({} as TtsConfigType),
          }),
        })
      )
      .min(2),
  });

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    values: chat
      ? {
          name: chat.name,
          topic: chat.topic,
          config: chat.config,
          members: [...chat.members],
        }
      : {
          name: t("newChat"),
          topic: "Casual Chat.",
          config: {
            sttEngine,
          },
          members: [
            {
              userId: user.id.toString(),
              userType: "User",
              config: {
                introduction: `I am ${nativeLanguage} speaker learning ${learningLanguage}.`,
              },
            },
          ],
        },
  });

  const onSubmit = form.handleSubmit((data) => {
    const { name, topic, members, config } = data;
    if (chat?.id) {
      updateChat(chat.id, {
        name,
        topic,
        members: members.map((member) => ({
          userId: member.userId,
          userType: member.userType,
          config: {
            prompt: member.config.prompt,
            introduction: member.config.introduction,
            gpt: member.config.gpt as GptConfigType,
            tts: member.config.tts as TtsConfigType,
          },
        })),
        config: {
          sttEngine: config.sttEngine,
        },
      }).then(() => onFinish());
    } else {
      createChat({
        name,
        topic,
        members: members.map((member) => ({
          userId: member.userId,
          userType: member.userType,
          config: {
            prompt: member.config.prompt,
            introduction: member.config.introduction,
            gpt: member.config.gpt as GptConfigType,
            tts: member.config.tts as TtsConfigType,
          },
        })),
        config: {
          sttEngine: config.sttEngine,
        },
      }).then(() => onFinish());
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="">
        <div className="mb-6">{chat?.id ? t("editChat") : t("newChat")}</div>
        <div className="space-y-4 mb-6">
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
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chat.topic")}</FormLabel>
                <Textarea className="max-h-96" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="config.sttEngine"
            render={({ field }) => (
              <FormItem className="grid w-full items-center">
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
        </div>
        <div className="flex items-center space-x-4">
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
