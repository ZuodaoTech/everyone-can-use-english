import { ChatAgentMessage, ChatUserMessage } from "@renderer/components";
import { useContext, useEffect } from "react";
import {
  AppSettingsProviderContext,
  ChatSessionProviderContext,
} from "@renderer/context";

export const ChatMessage = (props: {
  chatMessage: ChatMessageType;
  isLastMessage: boolean;
  onEditChatMember: (chatMember: ChatMemberType) => void;
}) => {
  const { chatMessage, isLastMessage, onEditChatMember } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { dispatchChatMessages } = useContext(ChatSessionProviderContext);

  useEffect(() => {
    if (chatMessage.role === "AGENT" && !chatMessage?.member) {
      EnjoyApp.chatMessages.findOne({ id: chatMessage.id }).then((message) => {
        dispatchChatMessages({
          type: "update",
          record: message,
        });
      });
    }
  }, [chatMessage]);

  if (chatMessage.role === "USER") {
    return (
      <ChatUserMessage
        chatMessage={props.chatMessage}
        isLastMessage={isLastMessage}
      />
    );
  } else if (props.chatMessage.role === "AGENT") {
    return (
      <ChatAgentMessage
        chatMessage={props.chatMessage}
        isLastMessage={isLastMessage}
        onEditChatMember={onEditChatMember}
      />
    );
  } else if (props.chatMessage.role === "SYSTEM") {
    return (
      <div className="text-sm text-muted-foreground text-center">
        {props.chatMessage.content}
      </div>
    );
  }
};
