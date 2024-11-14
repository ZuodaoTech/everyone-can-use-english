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
  SpeechIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useContext, useState } from "react";
import { ChatSettings } from "@renderer/components";
import { t } from "i18next";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { ChatTypeEnum } from "@/types/enums";
import { ChatSessionProviderContext } from "@/renderer/context";

export const ChatHeader = (props: {
  sidePanelCollapsed: boolean;
  toggleSidePanel: () => void;
}) => {
  const { sidePanelCollapsed, toggleSidePanel } = props;
  const [displayChatForm, setDisplayChatForm] = useState(false);
  const { chat } = useContext(ChatSessionProviderContext);

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
            <ChevronsRightIcon className="size-4" />
          ) : (
            <ChevronsLeftIcon className="size-4" />
          )}
        </Button>
        {chat.type === ChatTypeEnum.CONVERSATION && (
          <ChatBubbleIcon className="w-4 h-4" />
        )}
        {chat.type === ChatTypeEnum.GROUP && (
          <UsersRoundIcon className="w-4 h-4" />
        )}
        {chat.type === ChatTypeEnum.TTS && <SpeechIcon className="w-4 h-4" />}
        <span className="text-sm">{chat.name}</span>
      </div>
      <Dialog open={displayChatForm} onOpenChange={setDisplayChatForm}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute right-4">
            <SettingsIcon className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-screen-sm max-h-[70%] overflow-y-auto">
          <DialogTitle>{t("editChat")}</DialogTitle>
          <DialogDescription className="sr-only">
            Edit chat settings
          </DialogDescription>
          <ScrollArea className="h-full px-4">
            <ChatSettings onFinish={() => setDisplayChatForm(false)} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
