import {
  Avatar,
  AvatarFallback,
  Button,
  Input,
  ScrollArea,
} from "@renderer/components/ui";
import { ChatAgentCard, ChatAgentForm } from "@renderer/components";
import { PlusCircleIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { t } from "i18next";
import { useDebounce } from "@uidotdev/usehooks";
import { ChatProviderContext } from "@renderer/context";

export const ChatAgents = () => {
  const { chatAgents, fetchChatAgents, currentChatAgent, setCurrentChatAgent } =
    useContext(ChatProviderContext);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    fetchChatAgents(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <div className="overflow-hidden h-full relative p-3">
      <div className="sticky flex items-center space-x-2 mb-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-full"
          placeholder={t("search")}
        />
        <Button className="w-8 h-8" variant="ghost" size="icon">
          <PlusCircleIcon className="w-5 h-5" />
        </Button>
      </div>
      {chatAgents.length === 0 && (
        <div className="text-center my-4">
          <span className="text-sm text-muted-foreground">{t("noData")}</span>
        </div>
      )}
      <div className="grid gap-1">
        {chatAgents.map((chatAgent) => (
          <ChatAgentCard
            key={chatAgent.id}
            chatAgent={chatAgent}
            selected={currentChatAgent?.id === chatAgent.id}
            onSelect={setCurrentChatAgent}
          />
        ))}
      </div>
    </div>
  );
};
