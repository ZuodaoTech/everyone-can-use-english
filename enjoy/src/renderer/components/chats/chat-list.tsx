import { Button } from "@renderer/components/ui";
import { t } from "i18next";
import { useContext } from "react";
import { ChatProviderContext } from "@renderer/context";
import { ChatCard } from "@renderer/components";

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
    <div className="flex flex-col space-y-2 px-2 py-3">
      {chats.map((chat) => (
        <ChatCard
          key={chat.id}
          chat={chat}
          selected={currentChat?.id === chat.id}
          onSelect={setCurrentChat}
        />
      ))}
    </div>
  );
};
