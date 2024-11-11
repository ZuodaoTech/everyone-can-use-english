import {
  Avatar,
  AvatarFallback,
  Badge,
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
import { PlusIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  ChatSessionProviderContext,
} from "@renderer/context";
import { DEFAULT_GPT_CONFIG } from "@/constants";
import { ChatAgentTypeEnum, ChatTypeEnum } from "@/types/enums";

export const ChatSettings = (props: { onFinish?: () => void }) => {
  const { onFinish } = props;
  const { chat, chatMembers } = useContext(ChatSessionProviderContext);
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
        {chat.type === ChatTypeEnum.TTS ? (
          <ChatAgentForm agent={chatMembers[0]?.agent} onFinish={onFinish} />
        ) : agentMembers.length > 0 ? (
          <ChatMemberSetting
            chat={chat}
            agentMembers={agentMembers}
            onFinish={onFinish}
          />
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
  onFinish?: () => void;
}) => {
  const { chat, agentMembers, onFinish } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentGptEngine, ttsConfig } = useContext(AISettingsProviderContext);
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
            engine: ttsConfig.engine,
            model: ttsConfig.model,
            voice: ttsConfig.voice,
            language: ttsConfig.language,
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
          <span className="capitalize">{t("addMember")}</span>
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
            onFinish={onFinish}
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
                className="flex items-center justify-between space-x-4"
                onClick={() => {}}
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <img src={chatAgent.avatarUrl} alt={chatAgent.name} />
                    <AvatarFallback>{chatAgent.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 line-clamp-1 w-full">
                      <div className="text-sm line-clamp-1">
                        {chatAgent.name}
                      </div>
                      <Badge className="text-xs px-1" variant="secondary">
                        {chatAgent.type}
                      </Badge>
                    </div>
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
                    chatAgent.type === ChatAgentTypeEnum.TTS ||
                    agentMembers.findIndex(
                      (member) => member.userId === chatAgent.id
                    ) > -1
                  }
                >
                  {agentMembers.findIndex(
                    (member) => member.userId === chatAgent.id
                  ) > -1
                    ? t("added")
                    : t("addToChat")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
