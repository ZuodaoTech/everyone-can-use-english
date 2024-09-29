import { createContext, useEffect, useState } from "react";
import { useChat, useChatAgent } from "@renderer/hooks";

type CopilotProviderState = {
  display: boolean;
  setDisplay: (display: boolean) => void;
  chats: ChatType[];
  currentChat: ChatType;
  setCurrentChat: (chat: ChatType) => void;
  currentChatAgent: ChatAgentType;
  setCurrentChatAgent: (chatAgent: ChatAgentType) => void;
  fetchChats: (query?: string) => Promise<void>;
  createChat: (data: ChatDtoType) => Promise<void | ChatType>;
  updateChat: (id: string, data: ChatDtoType) => Promise<void>;
  destroyChat: (id: string) => Promise<void>;
  chatAgents: ChatAgentType[];
  fetchChatAgents: (query?: string) => Promise<void>;
  updateChatAgent: (
    id: string,
    data: Partial<ChatAgentType>
  ) => Promise<void | ChatAgentType>;
  createChatAgent: (
    data: Partial<ChatAgentType>
  ) => Promise<void | ChatAgentType>;
  destroyChatAgent: (id: string) => Promise<void>;
};

const initialState: CopilotProviderState = {
  display: false,
  setDisplay: () => null,
  chats: [],
  currentChat: null,
  setCurrentChat: () => null,
  currentChatAgent: null,
  setCurrentChatAgent: () => null,
  fetchChats: () => null,
  createChat: () => null,
  updateChat: () => null,
  destroyChat: () => null,
  chatAgents: [],
  fetchChatAgents: () => null,
  updateChatAgent: () => null,
  createChatAgent: () => null,
  destroyChatAgent: () => null,
};

export const CopilotProviderContext =
  createContext<CopilotProviderState>(initialState);

export const CopilotProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [display, setDisplay] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatType>(null);
  const [currentChatAgent, setCurrentChatAgent] = useState<ChatAgentType>(null);
  const { chats, fetchChats, createChat, updateChat, destroyChat } = useChat(
    currentChatAgent?.id
  );
  const {
    chatAgents,
    fetchChatAgents,
    updateChatAgent,
    createChatAgent,
    destroyChatAgent,
  } = useChatAgent();

  useEffect(() => {
    if (
      !currentChat ||
      chats.findIndex((chat) => chat.id === currentChat.id) === -1
    ) {
      setCurrentChat(chats[0]);
    }
  }, [chats]);

  useEffect(() => {
    if (currentChatAgent) return;

    setCurrentChatAgent(chatAgents[0]);
  }, [chatAgents]);

  return (
    <CopilotProviderContext.Provider
      value={{
        display,
        setDisplay,
        chats,
        fetchChats,
        currentChat,
        setCurrentChat,
        chatAgents,
        currentChatAgent,
        setCurrentChatAgent,
        createChat,
        updateChat,
        destroyChat,
        fetchChatAgents,
        updateChatAgent,
        createChatAgent,
        destroyChatAgent,
      }}
    >
      {children}
    </CopilotProviderContext.Provider>
  );
};
