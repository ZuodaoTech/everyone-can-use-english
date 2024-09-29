import { ChatSessionProvider, CopilotProviderContext } from "@renderer/context";
import { useContext } from "react";
import { Button, ScrollArea } from "@renderer/components/ui";
import { t } from "i18next";
import { ChatMessages, ChatInput } from "@renderer/components";
import { Tooltip } from "react-tooltip";

export const Copilot = () => {
  const { currentChat } = useContext(CopilotProviderContext);
  if (!currentChat)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">
          <Button variant="default" size="sm">
            {t("newChat")}
          </Button>
        </div>
      </div>
    );

  return (
    <ScrollArea className="h-screen relative">
      <div className="h-12 sticky top-0 mb-2 shadow-sm flex items-center z-10 bg-background px-4">
        <div className="text-sm text-muted-foreground">{currentChat.name}</div>
      </div>
      <ChatSessionProvider chat={currentChat}>
        <div className="w-full max-w-screen-md mx-auto">
          <ChatMessages />
          <div className="h-16" />
          <div className="absolute w-full max-w-screen-md bottom-0 min-h-16 pb-3 flex items-center">
            <ChatInput chat={currentChat} />
          </div>
        </div>
        <Tooltip id="chat-tooltip" />
      </ChatSessionProvider>
    </ScrollArea>
  );
};
