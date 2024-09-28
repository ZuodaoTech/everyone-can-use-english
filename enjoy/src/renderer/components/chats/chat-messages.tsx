import { ChatSessionProviderContext } from "@renderer/context";
import { ChatMemberForm, ChatMessage } from "@renderer/components";
import { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@renderer/components/ui";

export const ChatMessages = () => {
  const { chatMessages, chat } = useContext(ChatSessionProviderContext);
  const lastMessage = chatMessages[chatMessages.length - 1];
  const [editingChatMember, setEditingChatMember] =
    useState<ChatMemberType>(null);

  return (
    <>
      <div className="flex-1 space-y-4 px-4 mb-4">
        {chatMessages.map((message) => (
          <ChatMessage
            key={message.id}
            chatMessage={message}
            isLastMessage={lastMessage?.id === message.id}
            onEditChatMember={setEditingChatMember}
          />
        ))}
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
