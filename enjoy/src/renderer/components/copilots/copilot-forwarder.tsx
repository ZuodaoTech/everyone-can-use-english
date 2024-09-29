import { useContext, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@renderer/components/ui";
import {
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { ForwardIcon } from "lucide-react";
import { t } from "i18next";

export const CopilotForwarder = (props: {
  prompt: string;
  trigger?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const { prompt, trigger } = props;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {props.trigger || (
          <ForwardIcon
            data-tooltip-id="global-tooltip"
            data-tooltip-content={t("forward")}
            className="w-4 h-4 cursor-pointer"
          />
        )}
      </DialogTrigger>
      <DialogContent>
        {open && <CopilotForwarderContent onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
};

const CopilotForwarderContent = (props: { onClose: () => void }) => {
  const { onClose } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [chatAgents, setChatAgents] = useState<ChatAgentType[]>([]);
  const { setDisplay } = useContext(CopilotProviderContext);

  const fetchChatAgents = () => {
    EnjoyApp.chatAgents.findAll({}).then(setChatAgents);
  };

  const handleForward = (chatAgentId: string) => {
    setDisplay(true);
    onClose();
  };

  useEffect(() => {
    fetchChatAgents();
  }, []);

  return (
    <div>
      {chatAgents.map((chatAgent) => (
        <div key={chatAgent.id} onClick={() => handleForward(chatAgent.id)}>
          {chatAgent.name}
        </div>
      ))}
    </div>
  );
};
