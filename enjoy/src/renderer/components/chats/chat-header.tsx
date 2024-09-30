import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
} from "@renderer/components/ui";
import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { ChatSettings } from "@renderer/components";
import { t } from "i18next";

export const ChatHeader = (props: {
  chat: ChatType;
  sidePanelCollapsed: boolean;
  toggleSidePanel: () => void;
}) => {
  const { chat, sidePanelCollapsed, toggleSidePanel } = props;
  const [displayChatForm, setDisplayChatForm] = useState(false);
  return (
    <div className="h-10 border-b px-4 shadow flex items-center justify-between space-x-2 sticky top-0 z-10 bg-background mb-4">
      <div className="flex items-center space-x-1 line-clamp-1">
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={toggleSidePanel}
        >
          {sidePanelCollapsed ? (
            <ChevronsRightIcon className="w-5 h-5" />
          ) : (
            <ChevronsLeftIcon className="w-5 h-5" />
          )}
        </Button>
        <div className="flex items-center -space-x-2">
          {chat.members
            .filter((member) => member.agent)
            .map((member) => (
              <Avatar key={member.id} className="w-6 h-6">
                <AvatarImage src={member.agent?.avatarUrl} />
                <AvatarFallback>{member.agent?.name}</AvatarFallback>
              </Avatar>
            ))}
        </div>
        <span className="text-sm">{chat.name}</span>
      </div>
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
              chat={chat}
              onFinish={() => setDisplayChatForm(false)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
