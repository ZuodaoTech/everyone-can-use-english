import {
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { Input } from "@renderer/components/ui";
import { t } from "i18next";
import { ChatCard } from "@renderer/components";

export const CopilotChats = (props: { onCancel?: () => void }) => {
  const { onCancel } = props;
  const [chats, setChats] = useState<ChatType[]>([]);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentChat, setCurrentChat, occupiedChat } = useContext(
    CopilotProviderContext
  );
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
      <div className="sticky py-2 px-1">
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
      {chats.map((chat) => (
        <ChatCard
          key={chat.id}
          chat={chat}
          selected={currentChat?.id === chat.id}
          disabled={occupiedChat?.id === chat.id}
          onSelect={(chat) => {
            if (occupiedChat?.id === chat.id) {
              return;
            }
            setCurrentChat(chat);
            onCancel?.();
          }}
        />
      ))}
    </div>
  );
};
