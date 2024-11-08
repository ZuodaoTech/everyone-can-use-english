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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Switch,
  Textarea,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import Mustache from "mustache";
import { GPTForm, TTSForm } from "@renderer/components";

export const ChatMemberForm = (props: {
  chat: ChatType;
  member: Partial<ChatMemberType>;
  onFinish?: () => void;
  onDelete?: () => void;
}) => {
  const { member, onFinish, chat, onDelete } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

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

  const chatMemberFormSchema = z.object({
    chatId: z.string(),
    userId: z.string(),
    userType: z.enum(["User", "ChatAgent"]).default("ChatAgent"),
    config: z.object({
      prompt: z.string().optional(),
      replyOnlyWhenMentioned: z.boolean().default(false),
      gpt: z.object({
        engine: z.string(),
        model: z.string(),
        temperature: z.number(),
        maxCompletionTokens: z.number().optional(),
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
    values: {
      chatId: chat.id,
      ...member,
    },
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

  const handleRemove = () => {
    if (!member.id) return;

    EnjoyApp.chatMembers
      .destroy(member.id)
      .then(() => {
        toast.success(t("chatMemberRemoved"));
        onDelete?.();
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  if (!member) return null;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="config.replyOnlyWhenMentioned"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormLabel>{t("replyOnlyWhenMentioned")}</FormLabel>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
              <FormDescription>
                {t("replyOnlyWhenMentionedDescription")}
              </FormDescription>
            </FormItem>
          )}
        />
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
              <GPTForm form={form} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tts">
            <AccordionTrigger className="text-muted-foreground">
              {t("models.chatMember.ttsSettings")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 px-2">
              <TTSForm form={form} />
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
                  {t("remove")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("removeChatMember")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                  {t("removeChatMemberConfirmation")}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive-hover"
                    onClick={handleRemove}
                  >
                    {t("remove")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => onFinish?.()}
          >
            {t("cancel")}
          </Button>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Form>
  );
};
