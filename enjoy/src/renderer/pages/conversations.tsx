import { t } from "i18next";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@renderer/components/ui";
import { ConversationForm } from "@renderer/components";
import { useState, useEffect, useContext, useReducer } from "react";
import { ChevronLeftIcon, LoaderIcon, MessageCircleIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { conversationsReducer } from "@renderer/reducers";
import dayjs from "dayjs";

export default () => {
  const [editting, setEditting] = useState<boolean>(false);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [conversations, dispatchConversations] = useReducer(
    conversationsReducer,
    []
  );
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
    addDblistener(onConversationsUpdate);

    return () => {
      removeDbListener(onConversationsUpdate);
    };
  }, []);

  const fetchConversations = async () => {
    const _conversations = await EnjoyApp.conversations.findAll({});

    dispatchConversations({ type: "set", records: _conversations });
  };

  const onConversationsUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model != "Conversation") return;

    if (action === "destroy") {
      dispatchConversations({ type: "destroy", record });
    } else if (action === "create") {
      dispatchConversations({ type: "create", record });
      navigate(`/conversations/${record.id}`);
    }
  };

  return (
    <div className="h-full px-4 py-6 lg:px-8 bg-muted flex flex-col">
      <div className="w-full max-w-screen-md mx-auto flex-1">
        <div className="flex space-x-1 items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <span>{t("sidebar.aiAssistant")}</span>
        </div>

        <div className="my-6 flex justify-center">
          <Sheet open={editting} onOpenChange={(value) => setEditting(value)}>
            <SheetTrigger asChild>
              <Button className="h-12 rounded-lg w-96" disabled={editting}>
                {editting && <LoaderIcon className="animate-spin mr-2" />}
                {t("newConversation")}
              </Button>
            </SheetTrigger>

            <SheetContent className="p-0">
              <div className="h-screen">
                <ConversationForm
                  conversation={{}}
                  onFinish={() => setEditting(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {conversations.map((conversation) => (
          <Link key={conversation.id} to={`/conversations/${conversation.id}`}>
            <div className="bg-white text-primary rounded-full w-full mb-2 p-4 hover:bg-primary hover:text-white cursor-pointer flex items-center">
              <div className="">
                <MessageCircleIcon className="mr-2" />
              </div>
              <div className="flex-1 flex items-center justify-between space-x-4">
                <span className="line-clamp-1">{conversation.name}</span>
                <span className="min-w-fit">
                  {dayjs(conversation.createdAt).format("HH:mm L")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
