import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui";
import { t } from "i18next";
import { ChatMemberForm, ChatForm } from "@renderer/components";
import { useChatMember } from "@renderer/hooks";

export const ChatSettings = (props: {
  chat: ChatType;
  onFinish?: () => void;
}) => {
  const { chat, onFinish } = props;
  const { chatMembers } = useChatMember(chat.id);
  console.log(chatMembers);
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
        {agentMembers.length > 0 ? (
          <Tabs defaultValue={agentMembers[0]?.userId}>
            <TabsList>
              {agentMembers.map((member) => (
                <TabsTrigger key={member.userId} value={member.userId}>
                  {member.agent.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {agentMembers.map((member) => (
              <TabsContent key={member.userId} value={member.userId}>
                <ChatMemberForm chat={chat} member={member} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-muted-foreground py-4 text-center">
            {t("noData")}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
