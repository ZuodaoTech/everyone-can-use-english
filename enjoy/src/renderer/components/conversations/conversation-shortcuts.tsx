import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  ScrollArea,
  toast,
} from "@renderer/components/ui";
import { ConversationCard, LoaderSpin } from "@renderer/components";
import { LoaderIcon, CheckCircleIcon } from "lucide-react";
import { t } from "i18next";
import { useConversation } from "@renderer/hooks";
import { useNavigate } from "react-router-dom";

export const ConversationShortcuts = (props: {
  trigger: React.ReactNode;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  prompt: string;
  onReply?: (reply: Partial<MessageType>[]) => void;
  excludedIds?: string[];
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const {
    title,
    prompt,
    onReply,
    excludedIds = [],
    open,
    onOpenChange,
    trigger,
  } = props;
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const { chat } = useConversation();
  const [replies, setReplies] = useState<Partial<MessageType>[]>([]);
  const navigate = useNavigate();

  const fetchConversations = () => {
    const limit = 5;

    setLoading(true);
    EnjoyApp.conversations
      .findAll({
        order: [["updatedAt", "DESC"]],
        limit,
        offset: conversations.length,
      })
      .then((_conversations) => {
        if (_conversations.length === 0) {
          setHasMore(false);
          return;
        }

        if (_conversations.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (conversations.length === 0) {
          setConversations(_conversations);
        } else {
          setConversations([...conversations, ..._conversations]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const ask = (conversation: ConversationType) => {
    setLoading(true);

    chat({ content: prompt }, { conversation })
      .then((messages) => {
        setReplies(messages);
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const dialogContent = () => {
    if (loading) {
      return <LoaderSpin />;
    }

    if (replies.length > 0) {
      return (
        <div>
          <div className="mb-8 flex items-center justify-center">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
          </div>
          <div className="flex items-center justify-end space-x-4">
            <Button
              variant="secondary"
              onClick={() => {
                navigate(`/conversations/${replies[0].conversationId}`);
                setReplies([]);
              }}
            >
              {t("goToConversation")}
            </Button>
            <DialogClose asChild>
              <Button
                variant="default"
                onClick={() => {
                  onReply && onReply(replies);
                  setReplies([]);
                }}
              >
                {t("finish")}
              </Button>
            </DialogClose>
          </div>
        </div>
      );
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
              <div key={conversation.id} onClick={() => ask(conversation)}>
                <ConversationCard conversation={conversation} />
              </div>
            );
          })}

        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => fetchConversations()}
              disabled={loading || !hasMore}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || t("sendToAIAssistant")}</DialogTitle>
        </DialogHeader>
        {dialogContent()}
      </DialogContent>
    </Dialog>
  );
};
