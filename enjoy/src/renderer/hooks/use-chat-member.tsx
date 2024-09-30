import { useContext, useEffect, useReducer } from "react";
import {
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { chatMembersReducer } from "@renderer/reducers";

export const useChatMember = (chatId: string) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [chatMembers, dispatchChatMembers] = useReducer(chatMembersReducer, []);

  const fetchChatMembers = async () => {
    return EnjoyApp.chatMembers.findAll({ where: { chatId } }).then((data) => {
      dispatchChatMembers({ type: "set", records: data });
    });
  };

  const onChatMemberRecordUpdate = (event: CustomEvent) => {
    const { model, id, action, record } = event.detail || {};
    if (model !== "ChatMember") return;
    if (record.chatId !== chatId) return;

    switch (action) {
      case "update": {
        dispatchChatMembers({ type: "update", record });
        break;
      }
      case "destroy": {
        dispatchChatMembers({
          type: "remove",
          record: { id } as ChatMemberType,
        });
        break;
      }
      case "create": {
        dispatchChatMembers({ type: "append", record });
        break;
      }
    }
  };

  useEffect(() => {
    if (!chatId) return;

    fetchChatMembers();
    addDblistener(onChatMemberRecordUpdate);

    return () => {
      dispatchChatMembers({ type: "set", records: [] });
      removeDbListener(onChatMemberRecordUpdate);
    };
  }, [chatId]);

  return {
    chatMembers,
    fetchChatMembers,
  };
};
