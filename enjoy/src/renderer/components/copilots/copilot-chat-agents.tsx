import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { useDebounce } from "@uidotdev/usehooks";
import { ChatAgentCard } from "@renderer/components";
import { Input } from "@renderer/components/ui";

export const CopilotChatAgents = (props: {
  onSelect: (agent: ChatAgentType) => void;
}) => {
  const { onSelect } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [chatAgents, setChatAgents] = useState<ChatAgentType[]>([]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  const fetchChatAgents = async () => {
    EnjoyApp.chatAgents
      .findAll({
        query: debouncedQuery,
      })
      .then((agents) => {
        setChatAgents(agents);
      });
  };

  useEffect(() => {
    fetchChatAgents();
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <div className="sticky py-2 px-1">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded h-8 text-xs"
          placeholder={t("search")}
        />
      </div>
      {chatAgents.length === 0 && (
        <div className="text-center my-4">
          <span className="text-sm text-muted-foreground">{t("noData")}</span>
        </div>
      )}
      {chatAgents.map((agent) => (
        <ChatAgentCard
          key={agent.id}
          chatAgent={agent}
          selected={false}
          onSelect={() => onSelect(agent)}
        />
      ))}
    </div>
  );
};
