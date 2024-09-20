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
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from "@renderer/components/ui";
import { t } from "i18next";

export const ChatAgentForm = (props: {
  agent?: ChatAgentType;
  onSave: (data: {
    name: string;
    introduction: string;
    config: any;
  }) => Promise<any>;
  onDestroy: () => void;
}) => {
  const { agent, onSave, onDestroy } = props;

  const agentFormSchema = z.object({
    name: z.string().min(1),
    introduction: z.string().min(1),
    prompt: z.string(),
  });

  const form = useForm<z.infer<typeof agentFormSchema>>({
    resolver: zodResolver(agentFormSchema),
    values: agent || {
      name: "",
      introduction: "",
      prompt: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    const { name, introduction, ...config } = data;
    onSave({
      name,
      introduction,
      config,
    }).then(() => {
      if (agent?.id) return;
      form.reset();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <div className="mb-4">{agent?.id ? t("editAgent") : t("newAgent")}</div>
        <div className="space-y-4 px-2 mb-6">
          {form.watch("name") && (
            <Avatar className="w-16 h-16 border">
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${form.watch(
                  "name"
                )}`}
                alt={form.watch("name")}
              />
            </Avatar>
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chatAgent.name")}</FormLabel>
                <Input required {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="introduction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chatAgent.introduction")}</FormLabel>
                <Textarea required className="max-h-36" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("models.chatAgent.prompt")}</FormLabel>
                <Textarea required className="max-h-48" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center space-x-4">
          {agent?.id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="text-destructive" variant="secondary">
                  {t("delete")}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteChatAgent")}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                  {t("deleteChatAgentConfirmation")}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive-hover"
                    onClick={onDestroy}
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
