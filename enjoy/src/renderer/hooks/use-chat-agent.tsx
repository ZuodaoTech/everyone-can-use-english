import { useEffect, useContext, useReducer } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { chatAgentsReducer } from "@renderer/reducers";

export const useChatAgent = () => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [chatAgents, dispatchChatAgents] = useReducer(chatAgentsReducer, []);

  const fetchChatAgents = async (query?: string) => {
    EnjoyApp.chatAgents
      .findAll({ query })
      .then((data) => {
        dispatchChatAgents({ type: "set", records: data });
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const createChatAgent = (data: ChatAgentDtoType) => {
    return EnjoyApp.chatAgents
      .create(data)
      .then((agent) => {
        toast.success(t("models.chatAgent.created"));
        return agent;
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const updateChatAgent = (id: string, data: ChatAgentDtoType) => {
    return EnjoyApp.chatAgents
      .update(id, data)
      .then((agent) => {
        toast.success(t("models.chatAgent.updated"));
        return agent;
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const destroyChatAgent = (id: string) => {
    return EnjoyApp.chatAgents
      .destroy(id)
      .then(() => {
        toast.success(t("models.chatAgent.deleted"));
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const onChatAgentUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model !== "ChatAgent") return;
    switch (action) {
      case "create": {
        dispatchChatAgents({ type: "prepend", record });
        break;
      }
      case "update": {
        dispatchChatAgents({ type: "update", record });
        break;
      }
      case "destroy": {
        dispatchChatAgents({ type: "remove", record });
        break;
      }
    }
  };

  useEffect(() => {
    fetchChatAgents();
    addDblistener(onChatAgentUpdate);

    () => {
      removeDbListener(onChatAgentUpdate);
    };
  }, []);

  return {
    chatAgents,
    fetchChatAgents,
    createChatAgent,
    updateChatAgent,
    destroyChatAgent,
  };
};
