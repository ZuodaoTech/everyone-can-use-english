import {
  ChatSessionProviderContext,
} from "@renderer/context";
import { ChatMessage } from "@renderer/components";
import { useContext } from "react";

export const ChatMessages = () => {
  const { chatMessages } = useContext(ChatSessionProviderContext);
  const lastMessage = chatMessages[chatMessages.length - 1];

  return (
    <div className="flex-1 space-y-4 px-4 mb-4">
      {chatMessages.map((message) => (
        <ChatMessage key={message.id} chatMessage={message} isLastMessage={lastMessage?.id === message.id} />
      ))}
    </div>
  );
};
