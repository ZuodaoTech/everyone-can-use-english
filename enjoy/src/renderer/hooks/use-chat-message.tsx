import { useEffect, useContext, useReducer } from "react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { chatMessagesReducer } from "@renderer/reducers";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { LLMResult } from "@langchain/core/outputs";

export const useChatMessage = (chat: ChatType) => {
  const { EnjoyApp, user, apiUrl } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [chatMessages, dispatchChatMessages] = useReducer(
    chatMessagesReducer,
    []
  );

  const fetchChatMessages = async (query?: string) => {
    if (!chat?.id) return;

    return EnjoyApp.chatMessages
      .findAll({ where: { chatId: chat.id }, query })
      .then((data) => {
        dispatchChatMessages({ type: "set", records: data });
        return data;
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const onCreateUserMessage = (content: string, recordingUrl?: string) => {
    if (!content) return;

    const pendingMessage = chatMessages.find(
      (m) => m.member.userType === "User" && m.state === "pending"
    );

    if (pendingMessage) {
      return EnjoyApp.chatMessages.update(pendingMessage.id, {
        content,
        recordingUrl,
      });
    } else {
      return EnjoyApp.chatMessages
        .create({
          chatId: chat.id,
          memberId: chat.members.find((m) => m.userType === "User").id,
          content,
          state: "pending",
          recordingUrl,
        })
        .then((message) =>
          dispatchChatMessages({ type: "append", record: message })
        )
        .catch((error) => {
          toast.error(error.message);
        });
    }
  };

  const onUpdateMessage = (id: string, data: Partial<ChatMessageType>) => {
    return EnjoyApp.chatMessages.update(id, data);
  };

  const onDeleteMessage = async (chatMessageId: string) => {
    return EnjoyApp.chatMessages
      .destroy(chatMessageId)
      .then(() =>
        dispatchChatMessages({
          type: "remove",
          record: { id: chatMessageId } as ChatMessageType,
        })
      )
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const onChatMessageRecordUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail;
    if (model === "ChatMessage") {
      switch (action) {
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

  const askAgent = (member: ChatMemberType) => {
    if (chat.type === "conversation") {
      askAgentInConversation(member);
    } else if (chat.type === "group") {
      askAgentInGroup(member);
    }
  };

  const askAgentInConversation = async (member: ChatMemberType) => {
    const llm = buildLlm(member);
    const messages = await fetchChatMessageHistory();
    const chatHistory = new ChatMessageHistory();
    const lastMessage = messages[messages.length - 1];
    messages.slice(0, -1).forEach((message) => {
      if (message.member.userType === "User") {
        chatHistory.addUserMessage(message.content);
      } else if (message.member.userType === "ChatAgent") {
        chatHistory.addAIMessage(message.content);
      }
    });

    const memory = new BufferMemory({
      chatHistory,
      memoryKey: "history",
      returnMessages: true,
    });
    const prompt = ChatPromptTemplate.fromMessages([
      ["system" as MessageRoleEnum, member.agent.prompt],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);
    const chain = new ConversationChain({
      llm: llm as any,
      memory,
      prompt: prompt as any,
      verbose: true,
    });
    let response: LLMResult["generations"][0] = [];
    await chain.call({ input: lastMessage.content }, [
      {
        handleLLMEnd: async (output) => {
          response = output.generations[0];
        },
      },
    ]);
  };

  const askAgentInGroup = (member: ChatMemberType) => {
    const llm = buildLlm(member);
  };

  const buildLlm = (member: ChatMemberType) => {
    const {
      engine = "enjoyai",
      model = "gpt-4o",
      temperature,
      maxTokens,
      frequencyPenalty,
      presencePenalty,
      numberOfChoices,
    } = member.config.gpt;

    if (engine === "enjoyai") {
      return new ChatOpenAI({
        openAIApiKey: user.accessToken,
        configuration: {
          baseURL: `${apiUrl}/api/ai`,
        },
        maxRetries: 0,
        modelName: model,
        temperature,
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        n: numberOfChoices,
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
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        n: numberOfChoices,
      });
    }
  };

  const fetchChatMessageHistory = async () => {
    let limit = chat.config.gpt.historyBufferSize;
    if (!limit || limit < 0) {
      limit = 0;
    }
    const messages: ChatMessageType[] = await EnjoyApp.chatMessages.findAll({
      where: { chatId: chat.id },
      order: [["createdAt", "DESC"]],
      limit,
    });

    return messages.reverse();
  };

  useEffect(() => {
    if (!chat) return;

    addDblistener(onChatMessageRecordUpdate);
    fetchChatMessages();
    return () => {
      removeDbListener(onChatMessageRecordUpdate);
    };
  }, [chat]);

  return {
    chatMessages,
    fetchChatMessages,
    dispatchChatMessages,
    onCreateUserMessage,
    onUpdateMessage,
    onDeleteMessage,
  };
};
