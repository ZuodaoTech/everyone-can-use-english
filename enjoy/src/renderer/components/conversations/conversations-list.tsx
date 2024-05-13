import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button, ScrollArea } from "@renderer/components/ui";
import { LoaderSpin } from "@renderer/components";
import {
  MessageCircleIcon,
  LoaderIcon,
  SpeechIcon,
  MicIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";

export const ConversationsList = (props: {
  prompt: string;
  excludedIds?: string[];
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { prompt, excludedIds = [] } = props;
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const navigate = useNavigate();

  const fetchConversations = () => {
    if (offset === -1) return;

    const limit = 5;
    setLoading(true);
    EnjoyApp.conversations
      .findAll({
        order: [["updatedAt", "DESC"]],
        limit,
        offset,
      })
      .then((_conversations) => {
        if (_conversations.length === 0) {
          setOffset(-1);
          return;
        }

        if (_conversations.length < limit) {
          setOffset(-1);
        } else {
          setOffset(offset + _conversations.length);
        }

        if (offset === 0) {
          setConversations(_conversations);
        } else {
          setConversations([...conversations, ..._conversations]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  if (loading) {
    return <LoaderSpin />;
  }

  return (
    <ScrollArea>
      {conversations.filter((c) => !excludedIds.includes(c.id)).length ===
        0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          {t("noConversationsYet")}
        </div>
      )}

      {conversations
        .filter((c) => !excludedIds.includes(c.id))
        .map((conversation) => {
          return (
            <div
              key={conversation.id}
              onClick={() => {
                navigate(`/conversations/${conversation.id}?text=${prompt}`);
              }}
              className="bg-background text-primary rounded-full w-full mb-2 py-2 px-4 hover:bg-primary hover:text-white cursor-pointer flex items-center border"
              style={{
                borderLeftColor: `#${conversation.id
                  .replaceAll("-", "")
                  .slice(0, 6)}`,
                borderLeftWidth: 3,
              }}
            >
              <div className="">
                {conversation.type === "gpt" && (
                  <MessageCircleIcon className="mr-2" />
                )}

                {conversation.type === "tts" && <SpeechIcon className="mr-2" />}
                {conversation.type === "voice" && <MicIcon className="mr-2" />}
              </div>
              <div className="flex-1 truncated">{conversation.name}</div>
            </div>
          );
        })}

      {offset > -1 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => fetchConversations()}
            disabled={loading || offset === -1}
            className="px-4 py-2"
          >
            {t("loadMore")}
            {loading && <LoaderIcon className="w-4 h-4 animate-spin ml-2" />}
          </Button>
        </div>
      )}
    </ScrollArea>
  );
};
