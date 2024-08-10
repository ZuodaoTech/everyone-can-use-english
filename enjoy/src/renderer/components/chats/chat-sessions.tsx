import {
  AppSettingsProviderContext,
  ChatProviderContext,
  ChatSessionProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { ChatMessage } from "@renderer/components";
import { useContext, useEffect, useReducer } from "react";
import { chatMessagesReducer } from "@renderer/reducers";
import { useTranscribe } from "@renderer/hooks";
import { toast } from "@renderer/components/ui";

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
  const {
    recordingBlob,
    createChatSession,
    updateChatMessage,
  } = useContext(ChatSessionProviderContext);
  const { currentChat } = useContext(ChatProviderContext);
  const [messages, dispatchChatMessages] = useReducer(chatMessagesReducer, []);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { transcribe } = useTranscribe();

  const onRecorded = async (blob: Blob) => {
    try {
      const { transcript, url } = await transcribe(blob, {
        language: currentChat.language,
        service: currentChat.config.sttEngine,
        align: false,
      });

      if (chatSession.state === "pending") {
        const message = messages.find((m) => m.member.userType === "User");
        if (!message) return;

        await updateChatMessage(message.id, {
          content: transcript,
          recordingUrl: url,
        });
      } else {
        createChatSession({ transcript, recordingUrl: url });
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchMessages = async () => {
    EnjoyApp.chatMessages
      .findAll({ where: { sessionId: chatSession.id } })
      .then((data) => {
        dispatchChatMessages({ type: "set", records: data });
      });
  };

  const onChatMessageUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail;
    if (model === "ChatMessage") {
      switch (action) {
        case "create":
          fetchMessages();
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
          dispatchChatMessages({ type: "update", recording: record });
          break;
      }
    }
  };

  const next = async () => {
    const member = currentChat.members.find(
      (member) =>
        member.userType === "Agent" &&
        messages.findIndex((m) => m.member.userId === member.userId) === -1
    );
    if (!member) {
    }
  };

  useEffect(() => {
    if (!chatSession) return;

    fetchMessages();
    addDblistener(onChatMessageUpdate);

    return () => {
      removeDbListener(onChatMessageUpdate);
    };
  }, [chatSession]);

  useEffect(() => {
    if (chatSession?.state !== "pending") return;
    if (!recordingBlob) return;

    onRecorded(recordingBlob);
  }, [chatSession, recordingBlob]);

  return (
    <>
      {messages
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((message) => (
          <ChatMessage key={message.id} chatMessage={message} />
        ))}
    </>
  );
};
