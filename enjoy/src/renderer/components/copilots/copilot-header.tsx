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
  toast,
} from "@renderer/components/ui";
import {
  ArrowRightToLineIcon,
  ChevronDownIcon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react";
import { useContext, useState } from "react";
import { ChatSettings } from "@renderer/components";
import { t } from "i18next";
import {
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";

export const CopilotHeader = () => {
  const [displayChatForm, setDisplayChatForm] = useState(false);
  const { currentChat, setCurrentChat, buildAgentMember, active, setActive } =
    useContext(CopilotProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const handleNewChat = async () => {
    const agent = currentChat?.members.find(
      (member) => member.userType === "ChatAgent"
    )?.agent;
    if (!agent) {
      return;
    }

    EnjoyApp.chats
      .create({
        name: t("newChat"),
        config: {
          sttEngine: currentChat?.config.sttEngine,
        },
        members: [buildAgentMember(agent)],
      })
      .then((newChat) => {
        setCurrentChat(newChat);
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  if (!currentChat) return null;

  return (
    <div className="h-10 border-b px-3 shadow flex items-center justify-between space-x-2 sticky top-0 z-10 bg-background mb-4">
      <div className="flex items-center space-x-1 line-clamp-1">
        <Button variant="ghost" size="icon" className="w-6 h-6">
          <ChevronDownIcon className="w-4 h-4" />
        </Button>
        <div className="flex items-center -space-x-2">
          {currentChat?.members
            .filter((member) => member.agent)
            .map((member) => (
              <Avatar key={member.id} className="w-6 h-6">
                <AvatarImage src={member.agent?.avatarUrl} />
                <AvatarFallback>{member.agent?.name}</AvatarFallback>
              </Avatar>
            ))}
        </div>
        <span className="text-sm">{currentChat?.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={handleNewChat}
        >
          <PlusIcon className="w-5 h-5" />
        </Button>
        <Dialog open={displayChatForm} onOpenChange={setDisplayChatForm}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6">
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
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={() => setActive(!active)}
        >
          <ArrowRightToLineIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
