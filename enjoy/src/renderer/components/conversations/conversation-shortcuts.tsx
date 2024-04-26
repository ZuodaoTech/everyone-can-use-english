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
import { LoaderSpin } from "@renderer/components";
import {
  MessageCircleIcon,
  LoaderIcon,
  SpeechIcon,
  CheckCircleIcon,
} from "lucide-react";
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
  const [offset, setOffset] = useState<number>(0);
  const { chat } = useConversation();
  const [replies, setReplies] = useState<Partial<MessageType>[]>([]);
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
  }, [excludedIds]);

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
              <div
                key={conversation.id}
                onClick={() => ask(conversation)}
                className="bg-background text-primary rounded-full w-full mb-2 py-2 px-4 hover:bg-muted hover:text-muted-foreground cursor-pointer flex items-center border"
                style={{
                  borderLeftColor: `#${conversation.id
                    .replaceAll("-", "")
                    .substr(0, 6)}`,
                  borderLeftWidth: 3,
                }}
              >
                <div className="">
                  {conversation.type === "gpt" && (
                    <MessageCircleIcon className="mr-2" />
                  )}

                  {conversation.type === "tts" && (
                    <SpeechIcon className="mr-2" />
                  )}
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
