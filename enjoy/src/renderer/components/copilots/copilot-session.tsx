import { ChatSessionProvider, CopilotProviderContext } from "@renderer/context";
import { useContext } from "react";
import { Button, ScrollArea } from "@renderer/components/ui";
import { t } from "i18next";
import { ChatMessages, ChatInput, CopilotHeader } from "@renderer/components";

export const CopilotSession = () => {
  const { currentChat } = useContext(CopilotProviderContext);

  return (
    <ScrollArea className="h-content relative">
      {currentChat?.id ? (
        <ChatSessionProvider chatId={currentChat.id}>
          <CopilotHeader />
          <div className="w-full max-w-screen-md mx-auto">
            <ChatMessages />
            <div className="h-16" />
            <div className="absolute w-full max-w-screen-md bottom-0 min-h-16 pb-3 flex items-center">
              <ChatInput />
            </div>
          </div>
        </ChatSessionProvider>
      ) : (
        <div className="flex h-full items-center justify-center py-6">
          <div className="text-muted-foreground">
            <Button variant="default" size="sm">
              {t("newChat")}
            </Button>
          </div>
        </div>
      )}
    </ScrollArea>
  );
};
