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
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@renderer/components/ui";
import {
  ChevronDownIcon,
  ChevronsRightIcon,
  PlusIcon,
  SettingsIcon,
  SpeechIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useContext, useState } from "react";
import {
  ChatSettings,
  CopilotChatAgents,
  CopilotChats,
} from "@renderer/components";
import { t } from "i18next";
import {
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { ChatTypeEnum } from "@/types/enums";

export const CopilotHeader = () => {
  const [displayChatForm, setDisplayChatForm] = useState(false);
  const [displayChats, setDisplayChats] = useState(false);
  const [displayChatAgents, setDisplayChatAgents] = useState(false);
  const {
    currentChat,
    active,
    setActive,
    occupiedChat,
    setCurrentChat,
    buildAgentMember,
  } = useContext(CopilotProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  return (
    <div className="h-10 border-b px-3 shadow flex items-center justify-between space-x-2 sticky top-0 z-10 bg-background mb-4">
      <div className="flex items-center space-x-1 line-clamp-1">
        <Popover open={displayChats} onOpenChange={setDisplayChats}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6">
              <ChevronDownIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="overflow-y-auto max-h-96">
            <CopilotChats
              onSelect={(chat) => {
                if (occupiedChat?.id !== chat.id) {
                  setCurrentChat(chat);
                }
                setDisplayChats(false);
              }}
            />
          </PopoverContent>
        </Popover>
        {currentChat?.type === ChatTypeEnum.CONVERSATION && (
          <ChatBubbleIcon className="w-4 h-4" />
        )}
        {currentChat?.type === ChatTypeEnum.GROUP && (
          <UsersRoundIcon className="w-4 h-4" />
        )}
        {currentChat?.type === ChatTypeEnum.TTS && (
          <SpeechIcon className="w-4 h-4" />
        )}
        <span className="text-sm line-clamp-1">{currentChat?.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Popover open={displayChatAgents} onOpenChange={setDisplayChatAgents}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6">
              <PlusIcon className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="overflow-y-auto max-h-96">
            <CopilotChatAgents
              onSelect={(agent) => {
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
                  })
                  .finally(() => {
                    setDisplayChatAgents(false);
                  });
              }}
            />
          </PopoverContent>
        </Popover>
        {currentChat && (
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
                <ChatSettings onFinish={() => setDisplayChatForm(false)} />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={() => setActive(!active)}
        >
          <ChevronsRightIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
