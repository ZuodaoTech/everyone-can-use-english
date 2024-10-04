import {
  Avatar,
  AvatarFallback,
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { ChatMemberForm, ChatForm, ChatAgentForm } from "@renderer/components";
import { useChatMember } from "@renderer/hooks";
import { PlusIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { DEFAULT_GPT_CONFIG } from "@/constants";

export const ChatSettings = (props: {
  chat: ChatType;
  onFinish?: () => void;
}) => {
  const { chat, onFinish } = props;
  const { chatMembers } = useChatMember(chat.id);
  const agentMembers = chatMembers.filter(
    (member) => member.userType === "ChatAgent"
  );

  return (
    <Tabs defaultValue="chat" className="mb-6">
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="chat">{t("models.chat.chatSettings")}</TabsTrigger>
        <TabsTrigger value="members">
          {t("models.chat.memberSettings")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        <ChatForm chat={chat} onFinish={onFinish} />
      </TabsContent>

      <TabsContent value="members">
        {chat.type === "TTS" ? (
          <ChatAgentForm agent={chatMembers[0]?.agent} onFinish={onFinish} />
        ) : agentMembers.length > 0 ? (
          <ChatMemberSetting chat={chat} agentMembers={agentMembers} />
        ) : (
          <div className="text-muted-foreground py-4 text-center">
            {t("noData")}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

const ChatMemberSetting = (props: {
  chat: ChatType;
  agentMembers: Partial<ChatMemberType>[];
}) => {
  const { chat, agentMembers } = props;
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const { currentGptEngine, currentTtsEngine } = useContext(
    AISettingsProviderContext
  );
  const [memberTab, setMemberTab] = useState(agentMembers[0]?.userId);
  const [query, setQuery] = useState("");
  const [chatAgents, setChatAgents] = useState<ChatAgentType[]>([]);
  const debouncedQuery = useDebounce(query, 500);

  const handleAddAgentMember = (chatAgent: ChatAgentType) => {
    EnjoyApp.chatMembers
      .create({
        chatId: chat.id,
        userId: chatAgent.id,
        userType: "ChatAgent",
        config: {
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
      })
      .then(() => {
        toast.success(t("chatMemberAdded"));
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const fetchChatAgents = async (query?: string) => {
    EnjoyApp.chatAgents
      .findAll({ query })
      .then((data) => {
        setChatAgents(data);
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  useEffect(() => {
    fetchChatAgents(debouncedQuery);
  }, [debouncedQuery]);

  if (agentMembers.length === 0) return null;

  return (
    <Tabs value={memberTab} onValueChange={setMemberTab}>
      <TabsList>
        {agentMembers.map((member) => (
          <TabsTrigger key={member.userId} value={member.userId}>
            {member.agent.name}
          </TabsTrigger>
        ))}
        <TabsTrigger value="new">
          <PlusIcon className="w-4 h-4" />
          {t("addMember")}
        </TabsTrigger>
      </TabsList>
      {agentMembers.map((member) => (
        <TabsContent key={member.userId} value={member.userId}>
          <ChatMemberForm
            chat={chat}
            member={member}
            onDelete={() => {
              setMemberTab("new");
            }}
          />
        </TabsContent>
      ))}
      <TabsContent value="new">
        <div className="overflow-hidden h-full relative py-2 px-1">
          <div className="mb-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded h-8 text-xs"
              placeholder={t("search")}
            />
          </div>
          {chatAgents.length === 0 && (
            <div className="text-center my-4">
              <span className="text-sm text-muted-foreground">
                {t("noData")}
              </span>
            </div>
          )}
          <div className="grid gap-2">
            {chatAgents.map((chatAgent) => (
              <div
                key={chatAgent.id}
                className="flex items-center justify-between"
                onClick={() => {}}
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <img src={chatAgent.avatarUrl} alt={chatAgent.name} />
                    <AvatarFallback>{chatAgent.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm line-clamp-1">{chatAgent.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {chatAgent.description}
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleAddAgentMember(chatAgent);
                  }}
                  disabled={
                    agentMembers.findIndex(
                      (member) => member.userId === chatAgent.id
                    ) > -1
                  }
                >
                  {t("addToChat")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
