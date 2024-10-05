import { ScrollArea } from "@renderer/components/ui";
import { t } from "i18next";
import { ChatSessionProvider } from "@renderer/context";
import { ChatHeader, ChatInput, ChatMessages } from "@renderer/components";

export const ChatSession = (props: {
  chat: ChatType;
  setChat: (chat: ChatType) => void;
  sidePanelCollapsed: boolean;
  toggleSidePanel: () => void;
}) => {
  const { chat, setChat, sidePanelCollapsed, toggleSidePanel } = props;

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-muted-foreground">{t("noChatSelected")}</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen relative">
      <ChatHeader
        chat={chat}
        sidePanelCollapsed={sidePanelCollapsed}
        toggleSidePanel={toggleSidePanel}
      />
      <ChatSessionProvider chat={chat} setChat={setChat}>
        <div className="w-full max-w-screen-md mx-auto">
          <ChatMessages />
          <div className="h-16" />
          <div className="absolute w-full max-w-screen-md bottom-0 min-h-16 pb-3 flex items-center">
            <ChatInput chat={chat} />
          </div>
        </div>
      </ChatSessionProvider>
    </ScrollArea>
  );
};
