import { ChatSessionProviderContext } from "@renderer/context";
import { ChatMemberForm, ChatMessage, LoaderSpin } from "@renderer/components";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@renderer/components/ui";

export const ChatMessages = () => {
  const { chatMessages, chat, asking, chatMembers } = useContext(
    ChatSessionProviderContext
  );
  const lastMessage = chatMessages[chatMessages.length - 1];
  const [editingChatMember, setEditingChatMember] =
    useState<ChatMemberType>(null);

  return (
    <>
      <div className="flex-1 space-y-2 px-4 mb-4">
        {chatMembers
          .filter((member) => member.userType === "ChatAgent")
          .map((member) => (
            <div key={member.id} className="mb-6">
              <div className="mb-2 flex">
                <ChatAgentAvatar chatMember={member} onClick={() => {}} />
              </div>
              <div className="px-4 py-2 mb-2 rounded-lg border w-full max-w-prose">
                <div className="text-sm">{member.agent.introduction}</div>
              </div>
            </div>
          ))}
        {chatMessages.map((message) => (
          <ChatMessage
            key={message.id}
            chatMessage={message}
            isLastMessage={lastMessage?.id === message.id}
            onEditChatMember={setEditingChatMember}
          />
        ))}
        {asking && (
          <ChatAgentMessageLoading
            chatMember={asking}
            onClick={() => setEditingChatMember(asking)}
          />
        )}
      </div>
      <Dialog
        open={!!editingChatMember}
        onOpenChange={() => setEditingChatMember(null)}
      >
        <DialogContent className="max-w-screen-sm max-h-[70%] overflow-y-auto">
          <DialogTitle>{editingChatMember?.agent?.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Edit chat member
          </DialogDescription>
          <ChatMemberForm
            chat={chat}
            member={editingChatMember}
            onFinish={() => setEditingChatMember(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

const ChatAgentMessageLoading = (props: {
  chatMember: ChatMemberType;
  onClick: () => void;
}) => {
  const { chatMember, onClick } = props;
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ref]);

  return (
    <div ref={ref} className="mb-6">
      <div className="mb-2 flex">
        <ChatAgentAvatar chatMember={chatMember} onClick={onClick} />
      </div>
      <div className="px-4 py-2 mb-2 rounded-lg border w-full max-w-prose">
        <LoaderSpin />
      </div>
    </div>
  );
};

const ChatAgentAvatar = (props: {
  chatMember: ChatMemberType;
  onClick: () => void;
}) => {
  const { chatMember, onClick } = props;
  return (
    <div
      className="flex items-center space-x-2 cursor-pointer"
      onClick={onClick}
    >
      <Avatar className="w-8 h-8 bg-background avatar">
        <AvatarImage src={chatMember.agent.avatarUrl}></AvatarImage>
        <AvatarFallback className="bg-background">
          {chatMember.name}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="text-sm">{chatMember.name}</div>
        <div className="italic text-xs text-muted-foreground/50">
          {chatMember.config.gpt?.model || "AI"}
        </div>
      </div>
    </div>
  );
};
