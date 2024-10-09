import { useContext, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  toast,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@renderer/components/ui";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { ForwardIcon } from "lucide-react";
import { t } from "i18next";
import { CopilotChatAgents, CopilotChats } from "@renderer/components";
import { ChatMessageRoleEnum, ChatMessageStateEnum } from "@/types/enums";

export const CopilotForwarder = (props: {
  prompt: string;
  trigger?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const { prompt, trigger } = props;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <ForwardIcon
            data-tooltip-id="global-tooltip"
            data-tooltip-content={t("forward")}
            className="w-4 h-4 cursor-pointer"
          />
        )}
      </DialogTrigger>
      <DialogContent>
        {open && (
          <CopilotForwarderContent
            prompt={prompt}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const CopilotForwarderContent = (props: {
  prompt: string;
  onClose: () => void;
}) => {
  const { onClose, prompt } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { sttEngine } = useContext(AISettingsProviderContext);
  const { buildAgentMember } = useContext(CopilotProviderContext);
  const { setActive, setCurrentChat } = useContext(CopilotProviderContext);

  const handleSelectChatAgent = async (agent: ChatAgentType) => {
    EnjoyApp.chats
      .create({
        name: t("newChat"),
        config: {
          sttEngine,
        },
        members: [buildAgentMember(agent)],
      })
      .then(handleSelectChat)
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const handleSelectChat = async (chat: ChatType) => {
    console.log("handleSelectChat", chat);
    EnjoyApp.chatMessages
      .create({
        chatId: chat.id,
        content: prompt,
        role: ChatMessageRoleEnum.USER,
        state: ChatMessageStateEnum.PENDING,
      })
      .then(() => {
        setCurrentChat(chat);
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        onClose();
      });
  };

  return (
    <Tabs defaultValue="chats">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="chats">{t("recents")}</TabsTrigger>
        <TabsTrigger value="agents">{t("agents")}</TabsTrigger>
      </TabsList>
      <TabsContent value="chats">
        <CopilotChats onSelect={handleSelectChat} />
      </TabsContent>
      <TabsContent value="agents">
        <CopilotChatAgents onSelect={handleSelectChatAgent} />
      </TabsContent>
    </Tabs>
  );
};
