import { useEffect, useContext, useReducer } from "react";
import {
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { chatMessagesReducer } from "@renderer/reducers";

export const useChatMessage = (chat: ChatType) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [chatMessages, dispatchChatMessages] = useReducer(
    chatMessagesReducer,
    []
  );

  const fetchChatMessages = async (query?: string) => {
    if (!chat?.id) return;

    EnjoyApp.chatMessages
      .findAll({ where: { chatId: chat.id }, query })
      .then((data) => {
        dispatchChatMessages({ type: "set", records: data });
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const onCreateUserMessage = (content: string, recordingUrl?: string) => {
    if (!content) return;

    const pendingMessage = chatMessages.find(
      (m) => m.member.userType === "User" && m.state === "pending"
    );

    if (pendingMessage) {
      return EnjoyApp.chatMessages.update(pendingMessage.id, {
        content,
        recordingUrl,
      });
    } else {
      return EnjoyApp.chatMessages
        .create({
          chatId: chat.id,
          memberId: chat.members.find((m) => m.userType === "User").id,
          content,
          state: "pending",
          recordingUrl,
        })
        .then((message) =>
          dispatchChatMessages({ type: "append", record: message })
        )
        .catch((error) => {
          toast.error(error.message);
        });
    }
  };

  const onUpdateMessage = (id: string, data: Partial<ChatMessageType>) => {
    return EnjoyApp.chatMessages.update(id, data);
  };

  const onDeleteMessage = async (chatMessageId: string) => {
    return EnjoyApp.chatMessages
      .destroy(chatMessageId)
      .then(() =>
        dispatchChatMessages({
          type: "remove",
          record: { id: chatMessageId } as ChatMessageType,
        })
      )
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const onChatMessageRecordUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail;
    if (model === "ChatMessage") {
      switch (action) {
        case "update":
          dispatchChatMessages({ type: "update", record });
          break;
        case "destroy":
          dispatchChatMessages({ type: "remove", record });
          break;
      }
    } else if (model === "Recording") {
      switch (action) {
        case "create":
          dispatchChatMessages({
            type: "update",
            record: {
              id: record.targetId,
              recording: record,
            } as ChatMessageType,
          });
          break;
      }
    }
  };

  useEffect(() => {
    if (!chat) return;

    addDblistener(onChatMessageRecordUpdate);
    fetchChatMessages();
    return () => {
      removeDbListener(onChatMessageRecordUpdate);
    };
  }, [chat]);

  return {
    chatMessages,
    fetchChatMessages,
    dispatchChatMessages,
    onCreateUserMessage,
    onUpdateMessage,
    onDeleteMessage,
  };
};
