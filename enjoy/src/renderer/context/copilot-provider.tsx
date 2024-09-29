import { createContext, useEffect, useState, useContext } from "react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import { SttEngineOptionEnum } from "@/types/enums";
import { DEFAULT_GPT_CONFIG } from "@/constants";

type CopilotProviderState = {
  active: boolean;
  setActive: (active: boolean) => void;
  chats: ChatType[];
  currentChat: ChatType;
  setCurrentChat: (chat: ChatType) => void;
};

const initialState: CopilotProviderState = {
  active: false,
  setActive: () => null,
  chats: [],
  currentChat: null,
  setCurrentChat: () => null,
};

export const CopilotProviderContext =
  createContext<CopilotProviderState>(initialState);

export const CopilotProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [active, setActive] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatType>(null);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const [chats, setChats] = useState<ChatType[]>([]);
  const { sttEngine, currentGptEngine, currentTtsEngine } = useContext(
    AISettingsProviderContext
  );

  const findOrCreateChat = async () => {
    let chat = await EnjoyApp.chats.findOne({});
    if (chat) {
      setCurrentChat(chat);
    } else {
      const agent = await findOrCreateChatAgent();
      const chat = await EnjoyApp.chats.create({
        name: t("newChat"),
        config: {
          sttEngine,
        },
        members: [
          {
            userId: agent.id,
            userType: "ChatAgent",
            gpt: {
              ...DEFAULT_GPT_CONFIG,
              engine: currentGptEngine.name,
              model: currentGptEngine.models.default,
            },
            tts: {
              engine: currentTtsEngine.name,
              model: currentTtsEngine.model,
              voice: currentTtsEngine.voice,
              language: learningLanguage,
            },
          },
        ],
      });
      setCurrentChat(chat);
    }
  };

  const findOrCreateChatAgent = async () => {
    let agent = await EnjoyApp.chatAgents.findOne({});
    if (agent) {
      return agent;
    }

    return await EnjoyApp.chatAgents.create({
      name: t("models.chatAgent.namePlaceholder"),
      introduction: t("models.chatAgent.introductionPlaceholder"),
      prompt: t("models.chatAgent.promptPlaceholder"),
    });
  };

  useEffect(() => {
    findOrCreateChat();
  }, []);

  useEffect(() => {}, []);

  return (
    <CopilotProviderContext.Provider
      value={{
        active,
        setActive,
        chats,
        currentChat,
        setCurrentChat,
      }}
    >
      {children}
    </CopilotProviderContext.Provider>
  );
};
