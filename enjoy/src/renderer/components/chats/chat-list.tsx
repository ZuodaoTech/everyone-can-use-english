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

export const ChatList = (props: {
  chatAgent: ChatAgentType;
  currentChat: ChatType;
  setCurrentChat: (chat: ChatType) => void;
}) => {
  const { chatAgent, currentChat, setCurrentChat } = props;
  const { chats, createChat, destroyChat } = useChat(chatAgent?.id);
  const { sttEngine, currentGptEngine, currentTtsEngine } = useContext(
    AISettingsProviderContext
  );
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const {
    currentChat: copilotCurrentChat,
    setCurrentChat: setCopilotCurrentChat,
  } = useContext(CopilotProviderContext);
  const [deletingChat, setDeletingChat] = useState<ChatType>(null);

  useEffect(() => {
    if (
      !currentChat ||
      currentChat.members.findIndex(
        (member) => member.userId === chatAgent?.id
      ) === -1
    ) {
      const chat = chats.find((chat) => chat.id !== copilotCurrentChat?.id);
      if (chat) {
        setCurrentChat(chat);
      } else {
        handleCreateChat();
      }
    }
  }, [chats]);

  const handleCreateChat = () => {
    if (!chatAgent) {
      return;
    }
    createChat({
      name: t("newChat"),
      config: {
        sttEngine: sttEngine,
      },
      members: [buildAgentMember(chatAgent)],
    }).then((chat) => {
      if (chat) {
        setCurrentChat(chat);
      }
    });
  };

  const handleDeleteChat = async () => {
    if (!deletingChat) return;
    try {
      await destroyChat(deletingChat.id);
      if (deletingChat.id === currentChat?.id) {
        setCurrentChat(null);
      }
      if (deletingChat.id === copilotCurrentChat?.id) {
        setCopilotCurrentChat(null);
      }
      setDeletingChat(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const buildAgentMember = (agent: ChatAgentType): ChatMemberDtoType => {
    const config =
      agent.type === "TTS"
        ? {
            tts: {
              engine: currentTtsEngine.name,
              model: currentTtsEngine.model,
              voice: currentTtsEngine.voice,
              language: learningLanguage,
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
              engine: currentTtsEngine.name,
              model: currentTtsEngine.model,
              voice: currentTtsEngine.voice,
              language: learningLanguage,
            },
          };
    return {
      userId: agent.id,
      userType: "ChatAgent",
      config,
    };
  };

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
