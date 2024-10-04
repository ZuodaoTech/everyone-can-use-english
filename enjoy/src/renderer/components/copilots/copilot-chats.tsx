import {
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { Input } from "@renderer/components/ui";
import { t } from "i18next";
import { ChatCard } from "@renderer/components";
import { isSameTimeRange } from "@renderer/lib/utils";

export const CopilotChats = (props: { onSelect: (chat: ChatType) => void }) => {
  const { onSelect } = props;
  const [chats, setChats] = useState<ChatType[]>([]);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentChat, occupiedChat } = useContext(CopilotProviderContext);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  const fetchChats = async () => {
    const chats = await EnjoyApp.chats.findAll({ query: debouncedQuery });
    setChats(chats);
  };

  useEffect(() => {
    fetchChats();
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <div className="py-2 px-1">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded h-8 text-xs"
          placeholder={t("search")}
        />
      </div>
      {chats.length === 0 && (
        <div className="text-center my-4">
          <span className="text-sm text-muted-foreground">{t("noData")}</span>
        </div>
      )}
      {chats.map((chat, index) => (
        <ChatCard
          key={chat.id}
          chat={chat}
          displayDate={
            index === 0 ||
            !isSameTimeRange(chat.createdAt, chats[index - 1].createdAt)
          }
          selected={currentChat?.id === chat.id}
          disabled={occupiedChat?.id === chat.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
