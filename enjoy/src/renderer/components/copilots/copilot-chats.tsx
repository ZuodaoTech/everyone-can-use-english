import {
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Input,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { ChatCard } from "@renderer/components";
import { isSameTimeRange } from "@renderer/lib/utils";
import { useChat } from "@renderer/hooks";

export const CopilotChats = (props: { onSelect: (chat: ChatType) => void }) => {
  const { onSelect } = props;
  const { chats, fetchChats } = useChat();
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentChat, occupiedChat, setCurrentChat } = useContext(
    CopilotProviderContext
  );
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [deletingChat, setDeletingChat] = useState<ChatType>(null);

  const handleDeleteChat = async () => {
    if (!deletingChat) return;

    EnjoyApp.chats
      .destroy(deletingChat.id)
      .then(() => {
        toast.success(t("models.chat.deleted"));
        if (deletingChat.id === currentChat?.id) {
          setCurrentChat(null);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setDeletingChat(null);
      });
  };

  useEffect(() => {
    fetchChats(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <>
      <div className="relative">
        <div className="py-2 px-1">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded h-8 text-xs"
            placeholder={t("search")}
          />
        </div>
        {chats.length === 0 && (
          <div className="text-center my-4">
            <span className="text-sm text-muted-foreground">{t("noData")}</span>
          </div>
        )}
        {chats.map((chat, index) => (
          <ChatCard
            key={chat.id}
            chat={chat}
            displayDate={
              index === 0 ||
              !isSameTimeRange(chat.updatedAt, chats[index - 1].updatedAt)
            }
            selected={currentChat?.id === chat.id}
            disabled={occupiedChat?.id === chat.id}
            onSelect={onSelect}
            onDelete={setDeletingChat}
          />
        ))}
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
