import { useState, useEffect, useReducer, useContext, useRef } from "react";
import {
  Button,
  ScrollArea,
  Textarea,
  Sheet,
  SheetContent,
  SheetTrigger,
  toast,
} from "@renderer/components/ui";
import { MessageComponent, ConversationForm } from "@renderer/components";
import { SendIcon, BotIcon, LoaderIcon, SettingsIcon } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { t } from "i18next";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { messagesReducer } from "@renderer/reducers";
import { v4 as uuidv4 } from "uuid";
import autosize from "autosize";
import { useConversation } from "@renderer/hooks";

export default () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [editting, setEditting] = useState<boolean>(false);
  const [conversation, setConversation] = useState<ConversationType>();
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [content, setContent] = useState<string>(
    searchParams.get("text") || ""
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [messages, dispatchMessages] = useReducer(messagesReducer, []);
  const [offset, setOffest] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { chat } = useConversation();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchConversation = async () => {
    const _conversation = await EnjoyApp.conversations.findOne({ id });
    setConversation(_conversation);
  };

  const fetchMessages = async () => {
    if (offset === -1) return;

    const limit = 10;
    setLoading(true);
    EnjoyApp.messages
      .findAll({
        where: {
          conversationId: conversation.id,
        },
        offset,
        limit,
      })
      .then((_messages) => {
        if (_messages.length === 0) {
          setOffest(-1);
          return;
        }

        if (_messages.length < limit) {
          setOffest(-1);
        } else {
          setOffest(offset + _messages.length);
        }

        if (offset === 0) {
          dispatchMessages({ type: "set", records: _messages });
        } else {
          dispatchMessages({ type: "append", records: _messages });
        }
        scrollToMessage(_messages[0]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = async (text?: string, file?: string) => {
    if (submitting) {
      toast.warning(t("anotherRequestIsPending"));
    }
    text = text ? text : content;

    const message: MessageType = {
      id: uuidv4(),
      content: text,
      role: "user" as MessageRoleEnum,
      conversationId: id,
      status: "pending",
    };

    if (file) {
      message.speeches = [
        {
          id: uuidv4(),
          filePath: file,
          sourceId: message.id,
          sourceType: "Message",
        },
      ];
    }

    dispatchMessages({ type: "create", record: message });
    setSubmitting(true);

    scrollToMessage(message);

    const timeout = setTimeout(() => {
      message.status = "error";
      dispatchMessages({ type: "update", record: message });
      setSubmitting(false);
    }, 1000 * 60 * 5);

    if (conversation.type === "gpt") {
      chat(message, { conversation })
        .catch((err) => {
          message.status = "error";
          dispatchMessages({ type: "update", record: message });
          toast.error(err.message);
        })
        .finally(() => {
          setSubmitting(false);
          setContent("");
          clearTimeout(timeout);
        });
    } else if (conversation.type === "tts") {
      // reply with the same text
      // and create a speech using TTS
      const reply = {
        id: uuidv4(),
        content: message.content,
        role: "assistant" as MessageRoleEnum,
        conversationId: conversation.id,
      };
      EnjoyApp.messages
        .createInBatch([message, reply])
        .catch((err) => {
          message.status = "error";
          dispatchMessages({ type: "update", record: message });
          toast.error(err.message);
        })
        .finally(() => {
          setSubmitting(false);
          setContent("");
          clearTimeout(timeout);
        });
    }
  };

  const onMessagesUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model != "Message") return;
    if (record.conversationId !== id) return;

    if (action === "create") {
      if (record.role === "user") {
        dispatchMessages({ type: "update", record });
      } else {
        dispatchMessages({ type: "create", record });
      }

      scrollToMessage(record);
    } else if (action === "destroy") {
      dispatchMessages({ type: "destroy", record });
    }
  };

  const scrollToMessage = (message: MessageType) => {
    if (!message) return;

    setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      container
        .querySelector(`#message-${message.id} .avatar`)
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 500);
  };

  useEffect(() => {
    setOffest(0);
    setContent(searchParams.get("text") || "");
    dispatchMessages({ type: "set", records: [] });
    fetchConversation();
    addDblistener(onMessagesUpdate);

    return () => {
      removeDbListener(onMessagesUpdate);
    };
  }, [id]);

  useEffect(() => {
    if (!conversation) return;

    fetchMessages();
  }, [conversation]);

  useEffect(() => {
    if (!inputRef.current) return;

    autosize(inputRef.current);

    inputRef.current.addEventListener("keypress", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitRef.current?.click();
      }
    });

    inputRef.current.focus();

    return () => {
      inputRef.current?.removeEventListener("keypress", () => {});
      autosize.destroy(inputRef.current);
    };
  }, [id, inputRef.current]);

  if (!conversation) {
    return (
      <div className="w-full p-16 flex items-center justify-center">
        <LoaderIcon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div
      data-testid="conversation-page"
      className="h-screen px-4 py-6 lg:px-8 bg-muted flex flex-col"
    >
      <div className="h-[calc(100vh-3rem)] relative w-full max-w-screen-md mx-auto flex flex-col">
        <div className="flex items-center justify-center py-2 bg-gradient-to-b from-muted relative">
          <div className="cursor-pointer h-6 opacity-50 hover:opacity-100">
            <Link className="flex items-center" to="/conversations">
              <BotIcon className="h-5 mr-2" />
              <span className="">{conversation.name}</span>
            </Link>
          </div>

          <Sheet open={editting} onOpenChange={(value) => setEditting(value)}>
            <SheetTrigger>
              <div className="absolute right-4 top-0 py-3">
                <SettingsIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            </SheetTrigger>

            <SheetContent className="p-0">
              <div className="h-screen">
                <ConversationForm
                  conversation={conversation}
                  onFinish={() => {
                    setEditting(false);
                    fetchConversation();
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <ScrollArea ref={containerRef} className="px-4 flex-1">
          <div className="messages flex flex-col-reverse gap-6 my-6">
            <div className="w-full h-16"></div>
            {messages.map((message) => (
              <MessageComponent
                key={message.id}
                message={message}
                configuration={{
                  type: conversation.type,
                  ...conversation.configuration,
                }}
                onResend={() => {
                  if (message.status === "error") {
                    dispatchMessages({ type: "destroy", record: message });
                  }

                  handleSubmit(message.content);
                }}
                onRemove={() => {
                  if (message.status === "error") {
                    dispatchMessages({ type: "destroy", record: message });
                  } else {
                    EnjoyApp.messages.destroy(message.id).catch((err) => {
                      toast.error(err.message);
                    });
                  }
                }}
              />
            ))}
            {offset > -1 && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => fetchMessages()}
                  disabled={loading || offset === -1}
                  className="px-4 py-2"
                >
                  {t("loadMore")}
                  {loading && (
                    <LoaderIcon className="h-4 w-4 animate-spin ml-2" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-4 absolute w-full bottom-0 left-0 h-14 bg-muted z-50">
          <div className="focus-within:bg-background px-4 py-2 flex items-center space-x-4 rounded-lg border">
            <Textarea
              ref={inputRef}
              disabled={submitting}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("pressEnterToSend")}
              data-testid="conversation-page-input"
              className="px-0 py-0 shadow-none border-none focus-visible:outline-0 focus-visible:ring-0 border-none bg-muted focus:bg-background min-h-[1.25rem] max-h-[3.5rem] !overflow-x-hidden"
            />
            <Button
              type="submit"
              ref={submitRef}
              disabled={submitting || !content}
              data-testid="conversation-page-submit"
              onClick={() => handleSubmit(content)}
              className=""
            >
              <SendIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
