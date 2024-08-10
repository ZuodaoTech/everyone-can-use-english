import { useEffect, useContext, useReducer, useState } from "react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { chatSessionsReducer } from "@renderer/reducers";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const useChatSession = (chat: ChatType) => {
  const { EnjoyApp, user, apiUrl } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [chatSessions, dispatchChatSessions] = useReducer(
    chatSessionsReducer,
    []
  );
  const [submitting, setSubmitting] = useState(false);

  const currentSession = chatSessions.length
    ? chatSessions[chatSessions.length - 1]
    : null;

  const fetchChatSessions = async (chatId: string) => {
    EnjoyApp.chatSessions.findAll({ where: { chatId } }).then((data) => {
      dispatchChatSessions({ type: "set", records: data });
    });
  };

  const createChatSession = async (params: {
    transcript: string;
    recordingUrl: string;
  }) => {
    const { transcript, recordingUrl } = params;
    if (!transcript || !recordingUrl) return;

    setSubmitting(true);
    const member = chat.members.find(
      (member) => member.userId === user.id.toString()
    );

    return EnjoyApp.chatSessions
      .create({
        chatId: chat.id,
        chatMessage: {
          memberId: member.id,
          content: transcript,
        },
        url: recordingUrl,
      })
      .finally(() => setSubmitting(false));
  };

  const updateChatMessage = async (
    id: string,
    data: { state?: string; content?: string; recordingUrl?: string }
  ) => {
    setSubmitting(true);
    return EnjoyApp.chatMessages
      .update(id, data)
      .finally(() => setSubmitting(false));
  };

  const onChatSessionUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail;
    if (model === "ChatSession") {
      switch (action) {
        case "create":
          dispatchChatSessions({ type: "append", record });
          break;
        case "update":
          dispatchChatSessions({ type: "update", record });
          break;
        case "destroy":
          dispatchChatSessions({ type: "remove", record });
          break;
      }
    } else if (model === "ChatMessage") {
      switch (action) {
        case "create":
          dispatchChatSessions({ type: "addMessage", message: record });
          break;
        case "update":
          dispatchChatSessions({ type: "updateMessage", message: record });
          break;
        case "destroy":
          dispatchChatSessions({ type: "removeMessage", message: record });
          break;
      }
    }
  };

  const askAgent = async () => {
    const userMessage = currentSession.messages.find((m) => m.member.user);
    if (userMessage && userMessage.state !== "completed") {
      updateChatMessage(userMessage.id, {
        state: "completed",
      });
    }
    const member = chat.members.find(
      (member) =>
        member.userType === "Agent" &&
        currentSession.messages.findIndex(
          (m) => m.member.agent.id === member.id
        ) === -1
    );

    const llm = buildLlm(member.agent);
    const systemPrompt = buildAgentPrompt(member);
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "{input}"],
    ]);
    const chain = prompt.pipe(llm);
    return chain.invoke({ input: "What would you say?" });
  };

  const buildAgentPrompt = (member: ChatMemberType) => {
    return `${member.agent.config.prompt}
You are chatting in a chat room. You always reply in ${chat.language}.
${member.config.prompt || ""}

<Chat Topic>
${chat.topic}

<Chat Members>
${chat.members
  .map((m) => {
    if (m.user) {
      return `- ${m.user.name} (${m.config.introduction})`;
    } else if (m.agent) {
      return `- ${m.agent.name} (${m.agent.introduction})`;
    }
  })
  .join("\n")}

<Chat History>
${buildChatHistory()}
`;
  };

  const buildChatHistory = () => {
    return chatSessions
      .map((session) => {
        return session.messages
          .map(
            (message) =>
              `@${(message.member.user || message.member.agent).name}: ${
                message.content
              }`
          )
          .join("\n");
      })
      .join("\n");
  };

  const buildLlm = (agent: ChatAgentType) => {
    const { engine, model, temperature } = agent.config;

    if (engine === "enjoyai") {
      return new ChatOpenAI({
        openAIApiKey: user.accessToken,
        configuration: {
          baseURL: `${apiUrl}/api/ai`,
        },
        maxRetries: 0,
        modelName: model,
        temperature,
      });
    } else if (engine === "openai") {
      return new ChatOpenAI({
        openAIApiKey: openai.key,
        configuration: {
          baseURL: openai.baseUrl,
        },
        maxRetries: 0,
        modelName: model,
        temperature,
      });
    }
  };

  useEffect(() => {
    if (!chat) return;

    fetchChatSessions(chat.id);
    addDblistener(onChatSessionUpdate);

    return () => {
      removeDbListener(onChatSessionUpdate);
    };
  }, [chat?.id]);

  return {
    chatSessions,
    currentSession,
    createChatSession,
    updateChatMessage,
    submitting,
  };
};
