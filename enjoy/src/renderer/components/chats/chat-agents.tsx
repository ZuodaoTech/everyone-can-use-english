import { Button, Input } from "@renderer/components/ui";
import { ChatAgentCard } from "@renderer/components";
import { PlusIcon } from "lucide-react";
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
    <div className="overflow-hidden h-full relative py-2 px-1">
      <div className="sticky flex items-center space-x-2 py-2 px-1">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded h-8 text-xs"
          placeholder={t("search")}
        />
        <Button className="w-8 h-8 p-0" variant="ghost" size="icon">
          <PlusIcon className="w-4 h-4" />
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
