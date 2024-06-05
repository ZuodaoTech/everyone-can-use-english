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
  toast,
} from "@renderer/components/ui";
import {
  ConversationCard,
  ConversationForm,
  LoaderSpin,
} from "@renderer/components";
import { useState, useEffect, useContext, useReducer } from "react";
import { ChevronLeftIcon, LoaderIcon } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  DbProviderContext,
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { conversationsReducer } from "@renderer/reducers";
import { GPT_PRESETS } from "@/constants";

export default () => {
  const [searchParams] = useSearchParams();
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const { currentEngine } = useContext(AISettingsProviderContext);
  const [conversations, dispatchConversations] = useReducer(
    conversationsReducer,
    []
  );
  const [creating, setCreating] = useState<boolean>(false);
  const [preset, setPreset] = useState<any>({});
  const [config, setConfig] = useState<any>({
    gptPresets: [],
    customPreset: {},
    ttsPreset: {
      key: "tts",
      name: "TTS",
      engine: currentEngine.name,
      configuration: {
        type: "tts",
        tts: {
          engine: currentEngine.name,
          model: currentEngine.name === "enjoyai" ? "openai/tts-1" : "tts-1",
          voice: "alloy",
        },
      },
    },
  });
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
    addDblistener(onConversationsUpdate);

    return () => {
      removeDbListener(onConversationsUpdate);
    };
  }, []);

  useEffect(() => {
    const postId = searchParams.get("postId");
    if (!postId) return;

    webApi.post(postId).then((post) => {
      const preset: any = post.metadata.content;
      if (!preset?.configuration?.roleDefinition) {
        return;
      }

      setPreset(preset);
      setCreating(true);
    });
  }, [searchParams.get("postId")]);

  const fetchConversations = async () => {
    const limit = 10;

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
          dispatchConversations({ type: "set", records: _conversations });
        } else {
          dispatchConversations({ type: "append", records: _conversations });
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
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

  const preparePresets = async () => {
    let presets = GPT_PRESETS;
    let defaultGptPreset = {
      key: "custom",
      engine: currentEngine.name,
      name: t("custom"),
      configuration: {
        type: "gpt",
        engine: currentEngine.name,
        model: currentEngine.models.default,
        tts: {
          engine: currentEngine.name,
          model: currentEngine.name === "enjoyai" ? "openai/tts-1" : "tts-1",
        },
      },
    };
    let defaultTtsPreset = {
      key: "tts",
      name: "TTS",
      engine: currentEngine.name,
      configuration: {
        type: "tts",
        tts: {
          engine: currentEngine.name,
          model: currentEngine.name === "enjoyai" ? "openai/tts-1" : "tts-1",
          voice: "alloy",
        },
      },
    };

    try {
      const gptPresets: any[] = await webApi.config("gpt_presets");
      const defaultGpt = await webApi.config("default_gpt_preset");
      const defaultTts = await webApi.config("default_tts_preset");

      presets = gptPresets;
      if (defaultGpt.engine === currentEngine.name) {
        defaultGpt.key = "custom";
        defaultGpt.name = t("custom");
        defaultGpt.configuration.model = currentEngine.models.default;
        defaultGpt.configuration.tts.engine = currentEngine.name;

        defaultGptPreset = defaultGpt;
      }

      if (defaultTts.engine === currentEngine.name) {
        defaultTtsPreset = defaultTts;
      }
    } catch (error) {
      console.error(error);
    }

    const gptPresets = presets.map((preset) =>
      Object.assign({}, preset, {
        engine: currentEngine?.name,
        configuration: {
          ...preset.configuration,
          model: currentEngine.models.default,
          tts: {
            ...preset.configuration.tts,
            engine: currentEngine.name,
            model: currentEngine.name === "enjoyai" ? "openai/tts-1" : "tts-1",
          },
        },
      })
    );

    setConfig({
      gptPresets,
      customPreset: defaultGptPreset,
      ttsPreset: defaultTtsPreset,
    });
  };

  useEffect(() => {
    preparePresets();
  }, []);

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
                  {config.gptPresets.length === 0 && <LoaderSpin />}

                  {config.gptPresets.map((preset: any) => (
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
                    data-testid={`conversation-preset-${config.customPreset.key}`}
                    onClick={() => {
                      setPreset(config.customPreset);
                      setCreating(true);
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    {t("custom")} GPT
                  </Button>
                </DialogTrigger>
                {config.ttsPreset.key && (
                  <DialogTrigger asChild>
                    <Button
                      data-testid={`conversation-preset-${config.ttsPreset.key}`}
                      onClick={() => {
                        setPreset(config.ttsPreset);
                        setCreating(true);
                      }}
                      variant="secondary"
                      className="w-full"
                    >
                      TTS
                    </Button>
                  </DialogTrigger>
                )}
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
            <ConversationCard conversation={conversation} />
          </Link>
        ))}

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
      </div>
    </div>
  );
};
