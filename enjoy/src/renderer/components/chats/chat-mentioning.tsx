import { AppSettingsProviderContext } from "@/renderer/context";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@renderer/components/ui";
import { useContext, useEffect, useState } from "react";
import { ChatAgentCard } from "@renderer/components";

export const ChatMentioning = (props: {
  input: string;
  members: ChatAgentType[];
  mentioned?: string[];
  onMention: (chatAgent: ChatAgentType) => void;
  onRemove: (chatAgent: ChatAgentType) => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) => {
  const {
    input,
    members,
    mentioned = [],
    onMention,
    onRemove,
    onCancel,
    children,
  } = props;
  const [open, setOpen] = useState(false);
  const [chatAgents, setChatAgents] = useState<ChatAgentType[]>([]);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const fetchChatAgents = async () => {
    EnjoyApp.chatAgents.findAll({}).then((chatAgents) => {
      // sort members to the front
      const sortedChatAgents = [
        ...chatAgents.filter((ca) => !members.some((m) => m.id === ca.id)),
      ];
      setChatAgents(sortedChatAgents);
    });
  };

  useEffect(() => {
    // if input starts with @ and contains non-space characters, set open to true
    if (input === "@") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [input]);

  useEffect(() => {
    if (open) {
      fetchChatAgents();
    } else {
      onCancel();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        side="top"
        className="p-0 w-[var(--radix-popper-anchor-width)]"
      >
        <div className="w-full max-h-72 overflow-y-auto">
          {members.map((member) => (
            <ChatAgentCard
              key={member.id}
              chatAgent={member}
              onSelect={() => {
                if (mentioned.includes(member.id)) {
                  onRemove(member);
                } else {
                  onMention(member);
                }
              }}
              selected={mentioned.includes(member.id)}
            />
          ))}
          <Separator />
          {chatAgents.map((chatAgent) => (
            <ChatAgentCard
              key={chatAgent.id}
              chatAgent={chatAgent}
              onSelect={() => {
                if (mentioned.includes(chatAgent.id)) {
                  onRemove(chatAgent);
                } else {
                  onMention(chatAgent);
                }
              }}
              selected={mentioned.includes(chatAgent.id)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
