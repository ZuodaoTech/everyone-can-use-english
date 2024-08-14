import { useEffect, useContext, useReducer } from "react";
import {
  AppSettingsProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { chatMessagesReducer } from "@renderer/reducers";

export const useChatMessage = (chat: ChatType) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
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

  useEffect(() => {
    if (!chat) return;

    fetchChatMessages();
  }, [chat]);

  return {
    chatMessages,
    fetchChatMessages,
    dispatchChatMessages,
    onDeleteMessage,
  };
};
