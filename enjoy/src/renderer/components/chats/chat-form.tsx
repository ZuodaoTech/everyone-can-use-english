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
  Textarea,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useState } from "react";
import {
  AISettingsProviderContext,
  ChatProviderContext,
} from "@renderer/context";
import { SttEngineOptionEnum } from "@/types/enums";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export const ChatForm = (props: { chat?: ChatType; onFinish?: () => void }) => {
  const { chat, onFinish } = props;
  const { sttEngine } = useContext(AISettingsProviderContext);
  const [isMoreSettingsOpen, setIsMoreSettingsOpen] = useState(false);
  const { createChat, updateChat, destroyChat } =
    useContext(ChatProviderContext);

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
        config: {
          sttEngine: config.sttEngine,
          prompt: config.prompt,
        },
      }).then(() => onFinish());
    } else {
      createChat({
        name,
        topic,
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
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Form>
  );
};
