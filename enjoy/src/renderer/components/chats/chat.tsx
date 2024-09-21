import { SettingsIcon } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
} from "@renderer/components/ui";
import { t } from "i18next";
import { ChatProviderContext, ChatSessionProvider } from "@renderer/context";
import { useContext, useState } from "react";
import { ChatInput, ChatMessages, ChatSettings } from "@renderer/components";
import { Tooltip } from "react-tooltip";

export const Chat = () => {
  const { currentChat } = useContext(ChatProviderContext);
  const [displayChatForm, setDisplayChatForm] = useState(false);

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-muted-foreground">{t("noChatSelected")}</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen relative pb-16">
      <div className="h-12 border-b px-4 shadow flex items-center justify-center sticky top-0 z-10 bg-background mb-4">
        <span>
          {currentChat.name}({currentChat.membersCount})
        </span>
        <Dialog open={displayChatForm} onOpenChange={setDisplayChatForm}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute right-4">
              <SettingsIcon className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-screen-sm max-h-[70%] overflow-y-auto">
            <DialogTitle>{t("editChat")}</DialogTitle>
            <DialogDescription className="sr-only">
              Edit chat settings
            </DialogDescription>
            <ScrollArea className="h-full px-4">
              <ChatSettings
                chat={currentChat}
                onFinish={() => setDisplayChatForm(false)}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      <ChatSessionProvider chat={currentChat}>
        <ChatMessages />
        <div className="absolute bottom-0 w-full min-h-16 py-3 z-10 bg-background flex items-center border-t shadow-lg">
          <ChatInput />
          <Tooltip id="chat-input-tooltip" />
        </div>
      </ChatSessionProvider>
    </ScrollArea>
  );
};
