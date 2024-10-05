import { useEffect, useContext, useReducer } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { chatsReducer } from "@renderer/reducers";

export const useChat = (chatAgentId?: string) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const {
    currentChat: copilotCurrentChat,
    setCurrentChat: setCopilotCurrentChat,
  } = useContext(CopilotProviderContext);
  const [chats, dispatchChats] = useReducer(chatsReducer, []);

  const fetchChats = async (query?: string) => {
    EnjoyApp.chats
      .findAll({ query, chatAgentId })
      .then((data) => {
        dispatchChats({ type: "set", records: data });
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const updateChat = (id: string, data: ChatDtoType) => {
    return EnjoyApp.chats
      .update(id, data)
      .then((chat) => {
        dispatchChats({ type: "update", record: chat });
        toast.success(t("models.chat.updated"));
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const onChatUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model !== "Chat") return;
    switch (action) {
      case "create": {
        toast.success(t("models.chat.created"));
        dispatchChats({ type: "prepend", record });
        break;
      }
      case "update": {
        toast.success(t("models.chat.updated"));
        dispatchChats({ type: "update", record });
        break;
      }
      case "destroy": {
        toast.success(t("models.chat.deleted"));
        if (record.id === copilotCurrentChat?.id) {
          setCopilotCurrentChat(null);
        }
        dispatchChats({ type: "remove", record });
        break;
      }
    }
  };

  useEffect(() => {
    addDblistener(onChatUpdate);

    return () => {
      removeDbListener(onChatUpdate);
    };
  }, []);

  useEffect(() => {
    fetchChats();
  }, [chatAgentId]);

  return {
    chats,
    fetchChats,
    updateChat,
  };
};
