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
import { AppSettingsProviderContext } from "@renderer/context";
import { ForwardIcon } from "lucide-react";
import { t } from "i18next";

export const ChatAgentForwarder = (props: { trigger?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

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
      {open && <ChatAgentForwarderContent onClose={() => setOpen(false)} />}
    </Dialog>
  );
};

const ChatAgentForwarderContent = (props: { onClose: () => void }) => {
  const { onClose } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [chatAgents, setChatAgents] = useState<ChatAgentType[]>([]);

  const fetchChatAgents = () => {
    EnjoyApp.chatAgents.findAll({}).then(setChatAgents);
  };

  useEffect(() => {
    fetchChatAgents();
  }, []);

  return <div>ChatAgentForwarderContent</div>;
};
