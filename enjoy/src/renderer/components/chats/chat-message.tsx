import { ChatMessageCategoryEnum, ChatMessageRoleEnum } from "@/types/enums";
import { ChatAgentMessage, ChatUserMessage } from "@renderer/components";
import { t } from "i18next";

export const ChatMessage = (props: {
  chatMessage: ChatMessageType;
  isLastMessage: boolean;
  onEditChatMember: (chatMember: ChatMemberType) => void;
}) => {
  const { chatMessage, isLastMessage, onEditChatMember } = props;

  if (chatMessage.role === ChatMessageRoleEnum.USER) {
    return (
      <ChatUserMessage
        chatMessage={chatMessage}
        isLastMessage={isLastMessage}
      />
    );
  } else if (chatMessage.role === ChatMessageRoleEnum.AGENT) {
    return (
      <ChatAgentMessage
        chatMessage={props.chatMessage}
        isLastMessage={isLastMessage}
        onEditChatMember={onEditChatMember}
      />
    );
  } else if (chatMessage.role === ChatMessageRoleEnum.SYSTEM) {
    return (
      <div className="text-sm text-muted-foreground text-center">
        {chatMessage.category === ChatMessageCategoryEnum.MEMBER_JOINED && (
          <span>
            {chatMessage.agent
              ? t("memberJoined", { name: chatMessage.agent.name })
              : chatMessage.content}
          </span>
        )}
        {chatMessage.category === ChatMessageCategoryEnum.MEMBER_LEFT && (
          <span>
            {chatMessage.agent
              ? t("memberLeft", { name: chatMessage.agent.name })
              : chatMessage.content}
          </span>
        )}
      </div>
    );
  }
};
