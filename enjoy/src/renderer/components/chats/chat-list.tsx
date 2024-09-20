import { Button } from "@renderer/components/ui";
import { t } from "i18next";
import { useContext } from "react";
import { ChatProviderContext } from "@renderer/context";
import { ChatCard } from "@renderer/components";
import { PlusIcon } from "lucide-react";

export const ChatList = () => {
  const { chats, currentChat, setCurrentChat } =
    useContext(ChatProviderContext);

  if (chats.length === 0) {
    return (
      <>
        <div className="text-center my-4">
          <span className="text-sm text-muted-foreground">{t("noData")}</span>
        </div>
        <div className="flex items-center justify-center">
          <Button onClick={() => {}} variant="default" size="sm">
            {t("quickStart")}
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="overflow-hidden h-full py-2 px-1 relative">
      <Button
        className="w-full mb-1 p-1 justify-start items-center"
        variant="ghost"
        size="sm"
      >
        <PlusIcon className="w-4 h-4 mr-1" />
        <span className="text-xs font-semibold capitalize">{t("newChat")}</span>
      </Button>
      <div className="px-2 mb-1">
        <span className="text-sm font-semibold capitalize">{t("recents")}</span>
      </div>
      <div className="grid gap-1">
        {chats.map((chat) => (
          <ChatCard
            key={chat.id}
            chat={chat}
            selected={currentChat?.id === chat.id}
            onSelect={setCurrentChat}
          />
        ))}
      </div>
    </div>
  );
};
