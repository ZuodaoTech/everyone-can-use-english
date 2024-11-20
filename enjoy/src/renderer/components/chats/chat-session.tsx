import { ScrollArea } from "@renderer/components/ui";
import { t } from "i18next";
import { ChatSessionProvider } from "@renderer/context";
import { ChatHeader, ChatInput, ChatMessages } from "@renderer/components";

export const ChatSession = (props: {
  chatId: string;
  sidePanelCollapsed: boolean;
  toggleSidePanel: () => void;
}) => {
  const { chatId, sidePanelCollapsed, toggleSidePanel } = props;

  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-content">
        <span className="text-muted-foreground">{t("noChatSelected")}</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-content relative">
      <ChatSessionProvider chatId={chatId}>
        <ChatHeader
          sidePanelCollapsed={sidePanelCollapsed}
          toggleSidePanel={toggleSidePanel}
        />
        <div className="w-full max-w-screen-md mx-auto">
          <ChatMessages />
          <div className="h-96" />
          <div className="absolute w-full max-w-screen-md bottom-0 min-h-16 pb-3 flex items-center">
            <ChatInput />
          </div>
        </div>
      </ChatSessionProvider>
    </ScrollArea>
  );
};
