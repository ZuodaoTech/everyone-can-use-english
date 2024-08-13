import { PlusIcon } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  Input,
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import {
  AppSettingsProviderContext,
  ChatProviderContext,
} from "@renderer/context";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useDebounce } from "@uidotdev/usehooks";
import { ChatCard, ChatForm, ChatAgents } from "@renderer/components";

export const ChatSidebar = () => {
  const {
    chats,
    fetchChats,
    currentChat,
    setCurrentChat,
    chatAgents,
    createChat,
    createChatAgent,
  } = useContext(ChatProviderContext);
  const { user } = useContext(AppSettingsProviderContext);

  const [displayChatForm, setDisplayChatForm] = useState(false);
  const [displayAgentForm, setDisplayAgentForm] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  // generate chat agents and a chat for example
  const quickStart = async () => {
    try {
      const ava = await createChatAgent({
        name: "Ava",
        introduction: "I'm Ava, your English speaking teacher.",
        language: "en-US",
        config: {
          engine: "enjoyai",
          model: "gpt-4o",
          prompt:
            "You are an experienced English teacher who excels at improving students' speaking skills. You always use simple yet authentic words and sentences to help students understand.",
          temperature: 1,
          ttsEngine: "enjoyai",
          ttsModel: "azure/speech",
          ttsVoice: "en-US-AvaNeural",
        },
      });
      const andrew = await createChatAgent({
        name: "Andrew",
        introduction: "I'm Andrew, your American friend.",
        language: "en-US",
        config: {
          engine: "enjoyai",
          model: "gpt-4o",
          prompt:
            "You're a native American who speaks authentic American English, familiar with the culture and customs of the U.S. You're warm and welcoming, eager to make friends from abroad and share all aspects of American life.",
          temperature: 0.7,
          ttsEngine: "enjoyai",
          ttsModel: "azure/speech",
          ttsVoice: "en-US-AndrewNeural",
        },
      });
      if (!ava || !andrew) return;

      await createChat({
        name: "Making Friends",
        language: "en-US",
        topic: "Improving speaking skills and American culture.",
        members: [
          {
            userId: user.id.toString(),
            userType: "User",
            config: {
              introduction:
                "I'm studying English and want to make friends with native speakers.",
            },
          },
          {
            userId: ava.id,
            userType: "Agent",
          },
          {
            userId: andrew.id,
            userType: "Agent",
          },
        ],
        config: {
          sttEngine: "azure",
        },
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchChats(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <ScrollArea className="h-screen w-64 bg-muted border-r">
      <div className="flex items-center justify-around px-2 py-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-full"
          placeholder={t("search")}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="">
              <PlusIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDisplayChatForm(true)}>
              {t("addChat")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDisplayAgentForm(true)}>
              {t("agentsManagement")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {chats.length === 0 && (
        <>
          <div className="text-center my-4">
            <span className="text-sm text-muted-foreground">{t("noData")}</span>
          </div>
          <div className="flex items-center justify-center">
            <Button onClick={() => quickStart()} variant="default" size="sm">
              {t("quickStart")}
            </Button>
          </div>
        </>
      )}
      <div className="flex flex-col space-y-2 px-2">
        {chats.map((chat) => (
          <ChatCard
            key={chat.id}
            chat={chat}
            selected={currentChat?.id === chat.id}
            onSelect={setCurrentChat}
          />
        ))}
      </div>

      <Dialog open={displayChatForm} onOpenChange={setDisplayChatForm}>
        <DialogContent className="max-w-screen-md h-5/6">
          <DialogTitle className="sr-only"></DialogTitle>
          <ScrollArea className="h-full px-4">
            <ChatForm
              chatAgents={chatAgents}
              onSave={(data) =>
                createChat(data).then(() => setDisplayChatForm(false))
              }
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog open={displayAgentForm} onOpenChange={setDisplayAgentForm}>
        <DialogContent className="max-w-screen-md h-5/6 p-0">
          <DialogTitle className="sr-only"></DialogTitle>
          <ChatAgents />
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};
