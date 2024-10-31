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
  LoaderSpin,
  MarkdownWrapper,
  WavesurferPlayer,
  CopilotForwarder,
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
  MoreHorizontalIcon,
  SpeechIcon,
  Volume2Icon,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  ChatSessionProviderContext,
} from "@renderer/context";
import { useAiCommand, useSpeech } from "@renderer/hooks";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { md5 } from "js-md5";
import { ChatAgentTypeEnum, ChatTypeEnum } from "@/types/enums";

export const ChatAgentMessage = (props: {
  chatMessage: ChatMessageType;
  isLastMessage?: boolean;
  onEditChatMember: (chatMember: ChatMemberType) => void;
}) => {
  const { chatMessage, onEditChatMember, isLastMessage } = props;
  const { chat, chatMembers, askAgent } = useContext(
    ChatSessionProviderContext
  );
  const ref = useRef<HTMLDivElement>(null);
  const [speeching, setSpeeching] = useState(false);
  const [translation, setTranslation] = useState<string>();
  const [displayContent, setDisplayContent] = useState(
    !(chat.type === ChatTypeEnum.TTS || chat.config.enableAutoTts)
  );
  const [displayPlayer, setDisplayPlayer] = useState(false);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ref]);

  useEffect(() => {
    if (isLastMessage) {
      askAgent();
    }
  }, [chatMessage]);

  if (!chatMessage) return;
  const chatMember = chatMembers.find((m) => m?.id === chatMessage.member?.id);
  if (!chatMember?.agent) return;

  return (
    <div ref={ref}>
      <div className="mb-2 flex">
        <div
          className="flex items-center space-x-1 cursor-pointer"
          onClick={() => onEditChatMember(chatMember)}
        >
          <Avatar className="w-8 h-8 bg-background avatar">
            <AvatarImage src={chatMember.agent.avatarUrl}></AvatarImage>
            <AvatarFallback className="bg-background">
              {chatMember.agent.name}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs">{chatMember.agent.name}</div>
            <div className="italic text-xs text-muted-foreground/50">
              {chatMember.agent.type === ChatAgentTypeEnum.TTS &&
                chatMember.agent.config.tts?.voice}
              {chatMember.agent.type === ChatAgentTypeEnum.GPT &&
                chatMember.config.gpt.model}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 py-2 mb-2 rounded-lg w-full">
        {Boolean(chatMessage.speech?.id) ? (
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
          </>
        ) : (
          speeching && <LoaderSpin />
        )}
        {displayContent && (
          <>
            <MarkdownWrapper className="select-text prose dark:prose-invert max-w-full">
              {chatMessage.content}
            </MarkdownWrapper>
            {translation && (
              <MarkdownWrapper className="select-text prose dark:prose-invert max-w-full">
                {translation}
              </MarkdownWrapper>
            )}
          </>
        )}
        <ChatAgentMessageActions
          chatMessage={chatMessage}
          speeching={speeching}
          setSpeeching={setSpeeching}
          displayContent={displayContent}
          setDisplayContent={setDisplayContent}
          translation={translation}
          setTranslation={setTranslation}
          autoSpeech={
            isLastMessage &&
            (chat.type === ChatTypeEnum.TTS || chat.config.enableAutoTts)
          }
        />
      </div>
      <div className="flex justify-start text-xs text-muted-foreground timestamp">
        {formatDateTime(chatMessage.createdAt)}
      </div>
    </div>
  );
};

const ChatAgentMessageActions = (props: {
  chatMessage: ChatMessageType;
  speeching: boolean;
  setSpeeching: (speeching: boolean) => void;
  displayContent: boolean;
  setDisplayContent: (displayContent: boolean) => void;
  translation: string;
  setTranslation: (translation: string) => void;
  autoSpeech: boolean;
}) => {
  const {
    chatMessage,
    speeching,
    setSpeeching,
    displayContent,
    setDisplayContent,
    translation,
    setTranslation,
    autoSpeech,
  } = props;
  const { setShadowing, deleteMessage } = useContext(
    ChatSessionProviderContext
  );
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const [resourcing, setResourcing] = useState<boolean>(false);
  const { tts } = useSpeech();
  const [translating, setTranslating] = useState<boolean>(false);
  const { translate, summarizeTopic } = useAiCommand();

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

  const createSpeech = async () => {
    if (chatMessage?.speech) return;
    if (speeching) return;

    // To use fresh config from chat member
    const chatMember = await EnjoyApp.chatMembers.findOne({
      where: {
        id: chatMessage.member.id,
      },
    });

    if (!chatMember) {
      toast.error(t("models.chatMembers.notFound"));
      return;
    }

    setSpeeching(true);

    tts({
      sourceType: "ChatMessage",
      sourceId: chatMessage.id,
      text: chatMessage.content,
      configuration:
        chatMember.agent.type === ChatAgentTypeEnum.TTS
          ? chatMember.agent.config.tts
          : chatMember.config.tts,
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
      let name =
        speech.text.length > 20
          ? speech.text.substring(0, 17).trim() + "..."
          : speech.text;

      try {
        name = await summarizeTopic(speech.text);
      } catch (e) {
        console.warn(e);
      }

      EnjoyApp.audios
        .create(speech.filePath, {
          name,
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
    if (chatMessage?.speech) return;
    if (autoSpeech) {
      createSpeech();
    }
  }, [chatMessage]);

  return (
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
        {!Boolean(chatMessage.speech) && (
          <SpeechIcon
            data-tooltip-id="global-tooltip"
            data-tooltip-content={t("textToSpeech")}
            onClick={createSpeech}
            className="w-4 h-4 cursor-pointer"
          />
        )}
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
        <CopilotForwarder
          prompt={chatMessage.content}
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
          <MoreHorizontalIcon className="w-4 h-4" />
        </DropdownMenuTrigger>
      </div>

      <DropdownMenuContent>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => deleteMessage(chatMessage.id)}
        >
          <span className="mr-auto text-destructive capitalize">
            {t("delete")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
