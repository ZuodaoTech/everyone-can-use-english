import { t } from "i18next";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Sheet,
  SheetContent,
} from "@renderer/components/ui";
import { ConversationForm } from "@renderer/components";
import { useState, useEffect, useContext, useReducer } from "react";
import { ChevronLeftIcon, MessageCircleIcon, SpeechIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DbProviderContext,
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { conversationsReducer } from "@renderer/reducers";
import dayjs from "dayjs";

export default () => {
  const [creating, setCreating] = useState<boolean>(false);
  const [preset, setPreset] = useState<any>({});
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { currentEngine } = useContext(AISettingsProviderContext);
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

  const PRESETS = [
    {
      name: "英语教练",
      engine: currentEngine.name,
      configuration: {
        type: "gpt",
        model: "gpt-4-1106-preview",
        baseUrl: "",
        roleDefinition: `你是我的英语教练。
请将我的话改写成英文。
不需要逐字翻译。
请分析清楚我的内容，而后用英文重新逻辑清晰地组织它。
请使用地道的美式英语，纽约腔调。
请尽量使用日常词汇，尽量优先使用短语动词或者习惯用语。
每个句子最长不应该超过 20 个单词。`,
        temperature: 0.2,
        numberOfChoices: 1,
        maxTokens: 2048,
        presencePenalty: 0,
        frequencyPenalty: 0,
        historyBufferSize: 0,
        tts: {
          baseUrl: "",
          engine: currentEngine.name,
          model: "tts-1",
          voice: "alloy",
        },
      },
    },
    {
      name: "TTS",
      engine: currentEngine.name,
      configuration: {
        type: "tts",
        tts: {
          baseUrl: "",
          engine: currentEngine.name,
          model: "tts-1",
          voice: "alloy",
        },
      },
    },
    {
      name: t("custom"),
      engine: currentEngine.name,
      configuration: {
        type: "gpt",
        model: "gpt-4-1106-preview",
        baseUrl: "",
        roleDefinition: "",
        temperature: 0.2,
        numberOfChoices: 1,
        maxTokens: 2048,
        presencePenalty: 0,
        frequencyPenalty: 0,
        historyBufferSize: 0,
        tts: {
          baseUrl: "",
          engine: currentEngine.name,
          model: "tts-1",
          voice: "alloy",
        },
      },
    },
  ];

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
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-lg w-96">
                {t("newConversation")}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("selectAiRole")}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                {PRESETS.map((preset) => (
                  <DialogTrigger
                    key={preset.name}
                    className="p-4 border hover:shadow rounded-lg cursor-pointer space-y-2"
                    onClick={() => {
                      setPreset(preset);
                      setCreating(true);
                    }}
                  >
                    <div className="capitalize text-center line-clamp-1">
                      {preset.name}
                    </div>
                    {preset.configuration.roleDefinition && (
                      <div className="line-clamp-3 text-sm text-foreground/70">
                        {preset.configuration.roleDefinition}
                      </div>
                    )}
                  </DialogTrigger>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Sheet open={creating} onOpenChange={(value) => setCreating(value)}>
            <SheetContent className="p-0">
              <div className="h-screen">
                <ConversationForm
                  conversation={preset}
                  onFinish={() => setCreating(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {conversations.map((conversation) => (
          <Link key={conversation.id} to={`/conversations/${conversation.id}`}>
            <div
              className="bg-background text-muted-foreground rounded-full w-full mb-2 p-4 hover:bg-primary hover:text-muted cursor-pointer flex items-center"
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

                {conversation.type === "tts" && <SpeechIcon className="mr-2" />}
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
