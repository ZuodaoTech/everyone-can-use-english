import { useEffect, useContext, useReducer, useState } from "react";
import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { chatSessionsReducer } from "@renderer/reducers";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { toast } from "@renderer/components/ui";

export const useChatSession = (chat: ChatType) => {
  const { EnjoyApp, user, apiUrl } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);
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

    const member = chat.members.find(
      (member) => member.userId === user.id.toString()
    );
    if (!member) return;

    setSubmitting(true);
    return EnjoyApp.chatSessions
      .create({
        chatId: chat.id,
        chatMessage: {
          memberId: member.id,
          content: transcript,
        },
        url: recordingUrl,
      })
      .then((session) =>
        dispatchChatSessions({ type: "append", record: session })
      )
      .finally(() => setSubmitting(false));
  };

  const updateChatSession = async (id: string, data: { state: string }) => {
    setSubmitting(true);
    return EnjoyApp.chatSessions
      .update(id, data)
      .finally(() => setSubmitting)
      .then((session) =>
        dispatchChatSessions({ type: "update", record: session })
      )
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
          (m) => m.member.userId === member.userId
        ) === -1
    );
    if (!member) {
      return updateChatSession(currentSession.id, { state: "completed" });
    }

    const llm = buildLlm(member.agent);
    const systemPrompt = buildAgentPrompt(member);
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "{input}"],
    ]);
    const chain = prompt.pipe(llm);
    try {
      setSubmitting(true);
      const reply = await chain.invoke({
        input: "What would you say? Turn the content only.",
      });

      return EnjoyApp.chatMessages
        .create({
          sessionId: currentSession.id,
          memberId: member.id,
          content: reply.content,
          state: "completed",
        })
        .finally(() => setSubmitting(false));
    } catch (err) {
      setSubmitting(false);
      toast.error(err.message);
    }
  };

  const buildAgentPrompt = (member: ChatMemberType) => {
    return `You are @${member.agent.name}. ${member.agent.config.prompt}
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
  }, [chat?.id]);

  return {
    chatSessions,
    dispatchChatSessions,
    currentSession,
    createChatSession,
    updateChatMessage,
    submitting,
    askAgent,
  };
};
