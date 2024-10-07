import { EllipsisIcon, MessageCircleIcon, SpeechIcon } from "lucide-react";
import dayjs from "@renderer/lib/dayjs";
import { useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";

export const ConversationCard = (props: { conversation: ConversationType }) => {
  const { conversation } = props;
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);

  const handleDelete = () => {
    EnjoyApp.conversations.destroy(conversation.id).then(() => {
      toast.success(t("conversationDeleted"));
    });
  };

  const handleMigrate = () => {
    EnjoyApp.conversations
      .migrate(conversation.id)
      .then(() => {
        toast.success(t("conversationMigrated"));
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  return (
    <div
      className="bg-background hover:bg-muted hover:text-muted-foreground border rounded-full w-full mb-2 px-4 py-2 cursor-pointer flex items-center"
      style={{
        borderLeftColor: `#${conversation.id.replaceAll("-", "").slice(0, 6)}`,
        borderLeftWidth: 3,
      }}
    >
      <div className="">
        {conversation.type === "gpt" && <MessageCircleIcon className="mr-2" />}

        {conversation.type === "tts" && <SpeechIcon className="mr-2" />}
      </div>
      <div className="flex-1 flex items-center justify-between space-x-4">
        <div className="">
          <div className="line-clamp-1 text-sm">{conversation.name}</div>
          <div className="text-xs text-muted-foreground">
            {conversation.engine} |{" "}
            {conversation.type === "tts"
              ? conversation.configuration?.tts?.model
              : conversation.model}{" "}
            | {conversation.language || learningLanguage}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="min-w-fit text-sm text-muted-foreground">
            {dayjs(conversation.createdAt).format("HH:mm l")}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleMigrate();
                }}
              >
                <span>{t("migrateToChat")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete();
                }}
              >
                <span className="text-destructive">{t("delete")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
