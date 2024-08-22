import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from "@renderer/components/ui";
import {
  ConversationShortcuts,
  LoaderSpin,
  MarkdownWrapper,
  WavesurferPlayer,
} from "@renderer/components";
import { formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  ForwardIcon,
  LanguagesIcon,
  LoaderIcon,
  MicIcon,
  MoreVerticalIcon,
  RotateCcwIcon,
  Volume2Icon,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  ChatSessionProviderContext,
} from "@renderer/context";
import { useAiCommand, useConversation } from "@renderer/hooks";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { md5 } from "js-md5";

export const ChatAgentMessage = (props: {
  chatMessage: ChatMessageType;
  isLastMessage: boolean;
}) => {
  const { chatMessage, isLastMessage } = props;
  const { dispatchChatMessages, setShadowing, onDeleteMessage } = useContext(
    ChatSessionProviderContext
  );
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { agent } = chatMessage.member || {};
  const ref = useRef<HTMLDivElement>(null);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const [speeching, setSpeeching] = useState(false);
  const [resourcing, setResourcing] = useState<boolean>(false);
  const { tts } = useConversation();
  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);
  const { translate, summarizeTopic } = useAiCommand();
  const [displayContent, setDisplayContent] = useState(!isLastMessage);
  const [displayPlayer, setDisplayPlayer] = useState(false);

  const handleTranslate = async () => {
    if (translating) return;
    if (!chatMessage.content) return;

    const cacheKey = `translate-${md5(chatMessage.content)}`;
    try {
      const cached = await EnjoyApp.cacheObjects.get(cacheKey);

      if (cached && !translation) {
        setTranslation(cached);
      } else {
        setTranslating(true);
        const result = await translate(chatMessage.content, cacheKey);
        setTranslation(result);
        setTranslating(false);
      }
    } catch (err) {
      toast.error(err.message);
      setTranslating(false);
    }
  };

  const createSpeech = () => {
    if (chatMessage?.speech) return;
    if (speeching) return;

    setSpeeching(true);

    tts({
      sourceType: "ChatMessage",
      sourceId: chatMessage.id,
      text: chatMessage.content,
      configuration: {
        engine: chatMessage.member.agent.config.ttsEngine,
        model: chatMessage.member.agent.config.ttsModel,
        voice: chatMessage.member.agent.config.ttsVoice,
      },
    })
      .then((speech) => {
        dispatchChatMessages({
          type: "update",
          record: Object.assign({}, chatMessage, { speech }),
        });
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setSpeeching(false);
      });
  };

  const startShadow = async () => {
    if (resourcing) return;
    const speech = chatMessage.speech;
    if (!speech) return;

    const audio = await EnjoyApp.audios.findOne({
      md5: speech.md5,
    });

    if (!audio) {
      setResourcing(true);
      let title =
        speech.text.length > 20
          ? speech.text.substring(0, 17).trim() + "..."
          : speech.text;

      try {
        title = await summarizeTopic(speech.text);
      } catch (e) {
        console.warn(e);
      }

      EnjoyApp.audios
        .create(speech.filePath, {
          name: title,
          originalText: speech.text,
        })
        .then((audio) => setShadowing(audio))
        .catch((err) => toast.error(t(err.message)))
        .finally(() => {
          setResourcing(false);
        });
    } else {
      setShadowing(audio);
    }
  };

  const handleDownload = async () => {
    EnjoyApp.dialog
      .showSaveDialog({
        title: t("download"),
        defaultPath: chatMessage.speech.filename,
        filters: [
          {
            name: "Audio",
            extensions: [chatMessage.speech.filename.split(".").pop()],
          },
        ],
      })
      .then((savePath) => {
        if (!savePath) return;

        toast.promise(
          EnjoyApp.download.start(chatMessage.speech.src, savePath as string),
          {
            success: () => t("downloadedSuccessfully"),
            error: t("downloadFailed"),
            position: "bottom-right",
          }
        );
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ref]);

  useEffect(() => {
    if (chatMessage?.speech) return;

    createSpeech();
  }, [chatMessage]);

  if (!agent) return;

  return (
    <div ref={ref} className="mb-6">
      <div className="flex items-center space-x-2 mb-2">
        <Avatar className="w-8 h-8 bg-background avatar">
          <AvatarImage src={agent.avatarUrl}></AvatarImage>
          <AvatarFallback className="bg-background">
            {agent.name}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm text-muted-foreground">{agent.name}</div>
      </div>
      <div className="flex flex-col gap-4 px-4 py-2 mb-2 bg-background border rounded-lg shadow-sm w-full max-w-prose">
        {Boolean(chatMessage.speech) ? (
          <>
            {displayPlayer ? (
              <WavesurferPlayer
                id={chatMessage.speech.id}
                src={chatMessage.speech.src}
                autoplay={true}
              />
            ) : (
              <Button
                onClick={() => setDisplayPlayer(true)}
                className="w-8 h-8"
                variant="ghost"
                size="icon"
              >
                <Volume2Icon className="w-5 h-5" />
              </Button>
            )}
            {displayContent && (
              <>
                <MarkdownWrapper className="select-text prose dark:prose-invert">
                  {chatMessage.content}
                </MarkdownWrapper>
                {translation && (
                  <MarkdownWrapper className="select-text prose dark:prose-invert">
                    {translation}
                  </MarkdownWrapper>
                )}
              </>
            )}
          </>
        ) : speeching ? (
          <LoaderSpin />
        ) : (
          <div className="flex justify-center">
            <Button onClick={createSpeech}>
              <RotateCcwIcon className="w-4 h-4 mr-2" />
              {t("retry")}
            </Button>
          </div>
        )}
        <DropdownMenu>
          <div className="flex items-center space-x-4">
            {Boolean(chatMessage.speech) &&
              (resourcing ? (
                <LoaderIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("addingResource")}
                  className="w-4 h-4 animate-spin"
                />
              ) : (
                <MicIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("shadowingExercise")}
                  data-testid="message-start-shadow"
                  onClick={startShadow}
                  className="w-4 h-4 cursor-pointer"
                />
              ))}
            {displayContent ? (
              <EyeOffIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("hideContent")}
                className="w-4 h-4 cursor-pointer"
                onClick={() => setDisplayContent(false)}
              />
            ) : (
              <EyeIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("displayContent")}
                className="w-4 h-4 cursor-pointer"
                onClick={() => setDisplayContent(true)}
              />
            )}
            {translating ? (
              <LoaderIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("translating")}
                className="w-4 h-4 animate-spin"
              />
            ) : (
              displayContent && (
                <LanguagesIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("translation")}
                  className="w-4 h-4 cursor-pointer"
                  onClick={handleTranslate}
                />
              )
            )}
            {copied ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <CopyIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("copyText")}
                className="w-4 h-4 cursor-pointer"
                onClick={() => {
                  copyToClipboard(chatMessage.content);
                  setCopied(true);
                  setTimeout(() => {
                    setCopied(false);
                  }, 3000);
                }}
              />
            )}
            <ConversationShortcuts
              prompt={chatMessage.content}
              excludedIds={[]}
              trigger={
                <ForwardIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("forward")}
                  className="w-4 h-4 cursor-pointer"
                />
              }
            />
            {Boolean(chatMessage.speech) && (
              <DownloadIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("download")}
                data-testid="chat-message-download-speech"
                onClick={handleDownload}
                className="w-4 h-4 cursor-pointer"
              />
            )}

            <DropdownMenuTrigger>
              <MoreVerticalIcon className="w-4 h-4" />
            </DropdownMenuTrigger>
          </div>

          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onDeleteMessage(chatMessage.id)}
            >
              <span className="mr-auto text-destructive capitalize">
                {t("delete")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex justify-start text-xs text-muted-foreground timestamp">
        {formatDateTime(chatMessage.createdAt)}
      </div>
    </div>
  );
};
