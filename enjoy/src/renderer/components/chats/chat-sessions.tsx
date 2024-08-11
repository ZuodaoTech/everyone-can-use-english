import {
  AppSettingsProviderContext,
  ChatSessionProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { ChatMessage } from "@renderer/components";
import { useContext, useEffect, useReducer } from "react";

export const ChatSessions = () => {
  const { chatSessions } = useContext(ChatSessionProviderContext);

  return (
    <div className="flex-1 space-y-4 px-4 mb-4">
      {chatSessions.map((chatSession) => (
        <ChatSession key={chatSession.id} chatSession={chatSession} />
      ))}
    </div>
  );
};

const ChatSession = (props: { chatSession: ChatSessionType }) => {
  const { chatSession } = props;
  const { dispatchChatSessions } = useContext(ChatSessionProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);

  const onChatMessageUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail;
    if (model === "ChatMessage") {
      switch (action) {
        case "create":
          EnjoyApp.chatMessages
            .findAll({ where: { sessionId: chatSession.id } })
            .then((data) => {
              const session = Object.assign({}, chatSession, {
                messages: data,
              });
              dispatchChatSessions({ type: "update", record: session });
            });
          break;
        case "update":
          dispatchChatSessions({
            type: "update",
            record: Object.assign({}, chatSession, {
              messages: chatSession.messages.map((message) => {
                if (message.id === record.id) {
                  return Object.assign(message, record);
                } else {
                  return message;
                }
              }),
            }),
          });
          break;
        case "destroy":
          dispatchChatSessions({
            type: "update",
            record: Object.assign({}, chatSession, {
              messages: chatSession.messages.filter(
                (message) => message.id !== record.id
              ),
            }),
          });
          break;
      }
    } else if (model === "Recording") {
      switch (action) {
        case "create":
          const messages = chatSession.messages.map((message) => {
            if (message.id === record.targetId) {
              return Object.assign(message, { recording: record });
            } else {
              return message;
            }
          });
          dispatchChatSessions({
            type: "update",
            record: Object.assign({}, chatSession, { messages }),
          });
          break;
      }
    }
  };

  useEffect(() => {
    if (chatSession?.state !== "pending") return;

    addDblistener(onChatMessageUpdate);

    return () => {
      removeDbListener(onChatMessageUpdate);
    };
  }, [chatSession]);

  return (
    <>
      {chatSession.messages
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((message) => (
          <ChatMessage key={message.id} chatMessage={message} />
        ))}
    </>
  );
};
