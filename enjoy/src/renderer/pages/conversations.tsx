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
  ScrollArea,
} from "@renderer/components/ui";
import { ConversationForm } from "@renderer/components";
import { useState, useEffect, useContext, useReducer } from "react";
import { ChevronLeftIcon, MessageCircleIcon, SpeechIcon } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  DbProviderContext,
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { conversationsReducer } from "@renderer/reducers";
import dayjs from "dayjs";
import { CONVERSATION_PRESETS } from "@/constants";

export default () => {
  const [searchParams] = useSearchParams();
  const [creating, setCreating] = useState<boolean>(false);
  const [preset, setPreset] = useState<any>({});
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
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

  useEffect(() => {
    const postId = searchParams.get('postId');
    if (!postId) return;

    webApi.post(postId).then((post) => {
      const preset: any = post.metadata.content;
      if (!preset?.configuration?.roleDefinition) {
        return;
      }

      setPreset(preset);
      setCreating(true);
    })
  }, [searchParams.get('postId')])

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

  const presets = CONVERSATION_PRESETS.map((preset) =>
    Object.assign({}, preset, {
      engine: currentEngine?.name,
      configuration: {
        ...preset.configuration,
        tts: {
          ...preset.configuration.tts,
          engine: currentEngine?.name,
        },
      },
    })
  );

  const customPreset = {
    key: "custom",
    name: t("custom"),
    engine: currentEngine?.name,
    configuration: {
      type: "gpt",
      model: "gpt-4-turbo",
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
        engine: currentEngine?.name,
        model: "tts-1",
        voice: "alloy",
      },
    },
  };

  const ttsPreset = {
    key: "tts",
    name: "TTS",
    engine: "openai",
    configuration: {
      type: "tts",
      tts: {
        baseUrl: "",
        engine: currentEngine?.name,
        model: "tts-1",
        voice: "alloy",
      },
    },
  };

  return (
    <div className="h-full px-4 py-6 lg:px-8 flex flex-col">
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
              <Button
                data-testid="conversation-new-button"
                className="h-12 rounded-lg w-96"
              >
                {t("newConversation")}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("selectAiRole")}</DialogTitle>
              </DialogHeader>

              <div data-testid="conversation-presets" className="">
                <div className="text-sm text-foreground/70 mb-2">
                  {t("chooseFromPresetGpts")}
                </div>
                <ScrollArea className="h-64 pr-4">
                  {presets.map((preset) => (
                    <DialogTrigger
                      key={preset.key}
                      data-testid={`conversation-preset-${preset.key}`}
                      asChild
                      onClick={() => {
                        setPreset(preset);
                        setCreating(true);
                      }}
                    >
                      <div className="w-full p-2 cursor-pointer rounded hover:bg-muted">
                        <div className="capitalize truncate">{preset.name}</div>
                        {preset.configuration.roleDefinition && (
                          <div className="line-clamp-1 text-xs text-foreground/70">
                            {preset.configuration.roleDefinition}
                          </div>
                        )}
                      </div>
                    </DialogTrigger>
                  ))}
                </ScrollArea>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <DialogTrigger asChild>
                  <Button
                    data-testid={`conversation-preset-${customPreset.key}`}
                    onClick={() => {
                      setPreset(customPreset);
                      setCreating(true);
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    {t("custom")} GPT
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button
                    data-testid={`conversation-preset-${ttsPreset.key}`}
                    onClick={() => {
                      setPreset(ttsPreset);
                      setCreating(true);
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    TTS
                  </Button>
                </DialogTrigger>
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
              className="bg-background hover:bg-muted hover:text-muted-foreground border rounded-full w-full mb-2 p-4 cursor-pointer flex items-center"
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
