import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { ChatCard } from "@renderer/components";
import { PlusIcon } from "lucide-react";
import { DEFAULT_GPT_CONFIG } from "@/constants";
import { useChat } from "@renderer/hooks";
import { isSameTimeRange } from "@renderer/lib/utils";
import { ChatAgentTypeEnum } from "@/types/enums";

export const ChatList = (props: {
  chats: ChatType[];
  chatAgent: ChatAgentType;
  currentChat: ChatType;
  setCurrentChat: (chat: ChatType) => void;
}) => {
  const { chats, chatAgent, currentChat, setCurrentChat } = props;
  const { sttEngine, currentGptEngine, ttsConfig } = useContext(
    AISettingsProviderContext
  );
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const { currentChat: copilotCurrentChat } = useContext(
    CopilotProviderContext
  );
  const [deletingChat, setDeletingChat] = useState<ChatType>(null);

  const handleCreateChat = () => {
    if (!chatAgent) {
      return;
    }

    EnjoyApp.chats
      .create({
        name: t("newChat"),
        config: {
          sttEngine: sttEngine,
        },
        members: [buildAgentMember(chatAgent)],
      })
      .then((chat) => {
        setCurrentChat(chat);
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const handleDeleteChat = async () => {
    if (!deletingChat) return;

    EnjoyApp.chats
      .destroy(deletingChat.id)
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setDeletingChat(null);
      });
  };

  const buildAgentMember = (agent: ChatAgentType): ChatMemberDtoType => {
    const config =
      agent.type === ChatAgentTypeEnum.TTS
        ? {
            tts: {
              engine: ttsConfig.engine,
              model: ttsConfig.model,
              voice: ttsConfig.voice,
              language: ttsConfig.language,
              ...agent.config.tts,
            },
          }
        : {
            gpt: {
              ...DEFAULT_GPT_CONFIG,
              engine: currentGptEngine.name,
              model: currentGptEngine.models.default,
            },
            tts: {
              engine: ttsConfig.engine,
              model: ttsConfig.model,
              voice: ttsConfig.voice,
              language: ttsConfig.language,
            },
          };
    return {
      userId: agent.id,
      userType: "ChatAgent",
      config,
    };
  };

  useEffect(() => {
    if (!chatAgent) {
      setCurrentChat(null);
      return;
    }

    const currentAgentNotInvolved =
      currentChat?.members?.findIndex(
        (member) => member.userId === chatAgent?.id
      ) === -1;
    const currentChatIsNotFound =
      chats?.findIndex((chat) => chat.id === currentChat?.id) === -1;

    if (!currentChat || currentAgentNotInvolved || currentChatIsNotFound) {
      const chat = chats.find((chat) => chat.id !== copilotCurrentChat?.id);
      if (chat) {
        setCurrentChat(chat);
      } else {
        setCurrentChat(null);
      }
    }
  }, [chats, chatAgent]);

  return (
    <>
      <div className="overflow-y-auto h-full py-2 px-1 relative">
        <Button
          className="w-full mb-1 p-1 justify-start items-center"
          variant="ghost"
          size="sm"
          disabled={!chatAgent}
          onClick={handleCreateChat}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          <span className="text-xs font-semibold capitalize">
            {t("newChat")}
          </span>
        </Button>
        <div className="px-2 mb-1">
          <span className="text-sm font-semibold capitalize">
            {t("recents")}
          </span>
        </div>
        {chats.length === 0 && (
          <div className="text-center my-4">
            <span className="text-sm text-muted-foreground">{t("noData")}</span>
          </div>
        )}
        <div className="grid gap-1">
          {chats.map((chat, index) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              displayDate={
                index === 0 ||
                !isSameTimeRange(chat.updatedAt, chats[index - 1].updatedAt)
              }
              selected={currentChat?.id === chat.id}
              onSelect={setCurrentChat}
              onDelete={setDeletingChat}
            />
          ))}
        </div>
      </div>
      <AlertDialog
        open={!!deletingChat}
        onOpenChange={() => setDeletingChat(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{t("deleteChat")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteChatConfirmation")}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingChat(null)}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive-hover"
              onClick={handleDeleteChat}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
