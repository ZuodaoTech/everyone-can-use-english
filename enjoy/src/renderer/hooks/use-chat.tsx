import { useEffect, useContext, useReducer } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { chatsReducer } from "@renderer/reducers";

export const useChat = (chatAgentId: string) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [chats, dispatchChats] = useReducer(chatsReducer, []);

  const fetchChats = async (query?: string) => {
    if (!chatAgentId) return;

    EnjoyApp.chats
      .findAll({ query, chatAgentId })
      .then((data) => {
        dispatchChats({ type: "set", records: data });
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const createChat = (data: ChatDtoType) => {
    return EnjoyApp.chats
      .create(data)
      .then((chat) => {
        toast.success(t("models.chat.created"));
        dispatchChats({ type: "prepend", record: chat });
        return chat;
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const updateChat = (id: string, data: ChatDtoType) => {
    return EnjoyApp.chats
      .update(id, data)
      .then((chat) => {
        console.log(chat);
        dispatchChats({ type: "update", record: chat });
        toast.success(t("models.chat.updated"));
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const destroyChat = (id: string) => {
    return EnjoyApp.chats
      .destroy(id)
      .then(() => {
        toast.success(t("models.chat.deleted"));
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const onChatUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model !== "Chat") return;
    switch (action) {
      case "update": {
        dispatchChats({ type: "update", record });
        break;
      }
      case "destroy": {
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
    createChat,
    updateChat,
    destroyChat,
  };
};
