import { useContext, useEffect, useState } from "react";
import {
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";

export const useChatMember = (chatId: string) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [chatMembers, setChatMembers] = useState<ChatMemberType[]>([]);

  const fetchChatMembers = async () => {
    return EnjoyApp.chatMembers.findAll({ where: { chatId } }).then((data) => {
      setChatMembers(data);
    });
  };

  const onChatMemberRecordUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model !== "ChatMember") return;
    switch (action) {
      case "update": {
        setChatMembers((prev) => {
          return prev.map((m) => {
            if (m.id === record.id) {
              return record;
            }
            return m;
          });
        });
      }
      case "destroy": {
        setChatMembers((prev) => {
          return prev.filter((m) => m.id !== record.id);
        });
      }
      case "create": {
        setChatMembers((prev) => {
          return [...prev, record];
        });
      }
    }
  };

  useEffect(() => {
    if (!chatId) return;

    fetchChatMembers();
    addDblistener(onChatMemberRecordUpdate);

    return () => {
      setChatMembers([]);
      removeDbListener(onChatMemberRecordUpdate);
    };
  }, [chatId]);

  return {
    chatMembers,
    fetchChatMembers,
  };
};
