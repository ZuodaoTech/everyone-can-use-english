import { ChatAgentMessage, ChatUserMessage } from "@renderer/components";

export const ChatMessage = (props: {
  chatMessage: ChatMessageType;
  isLastMessage: boolean;
  onEditChatMember: (chatMember: ChatMemberType) => void;
}) => {
  const { chatMessage, isLastMessage, onEditChatMember } = props;

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
