import { ChatAgentMessage, ChatUserMessage } from "@renderer/components";
import { useContext, useEffect } from "react";
import {
  AppSettingsProviderContext,
  ChatSessionProviderContext,
} from "@renderer/context";

export const ChatMessage = (props: { chatMessage: ChatMessageType }) => {
  const { chatMessage } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { dispatchChatMessages } = useContext(ChatSessionProviderContext);

  useEffect(() => {
    if (!chatMessage?.member) {
      EnjoyApp.chatMessages.findOne({ id: chatMessage.id }).then((message) => {
        dispatchChatMessages({
          type: "update",
          record: message,
        });
      });
    }
  }, [chatMessage]);

  if (chatMessage.member?.userType === "User") {
    return <ChatUserMessage chatMessage={props.chatMessage} />;
  } else if (props.chatMessage.member?.userType === "Agent") {
    return <ChatAgentMessage chatMessage={props.chatMessage} />;
  }
};
