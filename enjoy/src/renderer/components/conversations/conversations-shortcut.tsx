import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { ScrollArea, toast } from "@renderer/components/ui";
import { LoaderSpin } from "@renderer/components";
import { MessageCircleIcon } from "lucide-react";

export const ConversationsShortcut = (props: {
  prompt: string;
  onReply?: (reply: MessageType[]) => void;
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { prompt, onReply } = props;
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const ask = (conversation: ConversationType) => {
    setLoading(true);
    EnjoyApp.conversations
      .ask(conversation.id, {
        content: prompt,
      })
      .then((replies) => {
        onReply(replies);
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    EnjoyApp.conversations.findAll({ limit: 10 }).then((conversations) => {
      setConversations(conversations);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoaderSpin />;
  }

  return (
    <ScrollArea>
      {conversations.map((conversation) => {
        return (
          <div
            key={conversation.id}
            onClick={() => ask(conversation)}
            className="bg-background text-primary rounded-full w-full mb-2 py-2 px-4 hover:bg-primary hover:text-white cursor-pointer flex items-center border"
            style={{
              borderLeftColor: `#${conversation.id
                .replaceAll("-", "")
                .substr(0, 6)}`,
              borderLeftWidth: 3,
            }}
          >
            <div className="">
              <MessageCircleIcon className="mr-2" />
            </div>
            <div className="flex-1 truncated">{conversation.name}</div>
          </div>
        );
      })}
    </ScrollArea>
  );
};
