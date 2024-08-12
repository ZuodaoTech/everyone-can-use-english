import { useEffect, useContext, useReducer } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
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
    EnjoyApp.chatMessages
      .findAll({ chatId: chat.id, query })
      .then((data) => {
        dispatchChatMessages({ type: "set", records: data });
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const onChatMessageUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail;
    if (model === "ChatMessage") {
      switch (action) {
        case "create":
          dispatchChatMessages({ type: "append", record });
          break;
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
    fetchChatMessages();
    addDblistener(onChatMessageUpdate);

    return () => {
      removeDbListener(onChatMessageUpdate);
    };
  }, []);

  return {
    chatMessages,
    fetchChatMessages,
    dispatchChatMessages,
  };
};