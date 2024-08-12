import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  toast,
} from "@renderer/components/ui";
import {
  ConversationShortcuts,
  LoaderSpin,
  MarkdownWrapper,
  PronunciationAssessmentScoreDetail,
  SpeechPlayer,
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
  GaugeCircleIcon,
  LanguagesIcon,
  LoaderIcon,
  MicIcon,
  SendIcon,
  SparkleIcon,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  ChatSessionProviderContext,
} from "@renderer/context";
import { useAiCommand, useConversation } from "@renderer/hooks";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { md5 } from "js-md5";

export const ChatMessage = (props: { chatMessage: ChatMessageType }) => {
  const { chatMessage } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { dispatchChatMessages } = useContext(ChatSessionProviderContext);

  useEffect(() => {
    if (!chatMessage?.member) {
      EnjoyApp.chatMessages.findOne({ id: chatMessage.id }).then((message) => {
        dispatchChatMessages({
          type: "update",
          record: message,
        });
      });
    }
  }, [chatMessage]);

  if (chatMessage.member?.userType === "User") {
    return <ChatUserMessage chatMessage={props.chatMessage} />;
  } else if (props.chatMessage.member?.userType === "Agent") {
    return <ChatAgentMessage chatMessage={props.chatMessage} />;
  }
};

export const ChatAgentMessage = (props: { chatMessage: ChatMessageType }) => {
  const { chatMessage } = props;
  const { dispatchChatMessages, setShadowing } = useContext(
    ChatSessionProviderContext
  );
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { agent } = chatMessage.member || {};
  const ref = useRef<HTMLDivElement>(null);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const [speeching, setSpeeching] = useState(false);
  const [resourcing, setResourcing] = useState<boolean>(false);
  const [displayContent, setDisplayContent] = useState(false);
  const { tts } = useConversation();
  const [translation, setTranslation] = useState<string>();
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
      <div className="flex flex-col gap-4 px-4 py-2 mb-2 bg-background border rounded-lg shadow-sm w-full max-w-lg">
        {speeching && <LoaderSpin />}
        {Boolean(chatMessage.speech) && (
          <>
            <SpeechPlayer speech={chatMessage.speech} />
            <MarkdownWrapper
              className={`select-text prose dark:prose-invert ${
                displayContent ? "" : "blur"
              }`}
            >
              {chatMessage.content}
            </MarkdownWrapper>
            {translation && (
              <MarkdownWrapper className="select-text prose dark:prose-invert">
                {translation}
              </MarkdownWrapper>
            )}
          </>
        )}
        <div className="flex items-center space-x-4">
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
          {translating ? (
            <LoaderIcon
              data-tooltip-id="global-tooltip"
              data-tooltip-content={t("creatingSpeech")}
              className="w-4 h-4 animate-spin"
            />
          ) : (
            <LanguagesIcon
              data-tooltip-id="global-tooltip"
              data-tooltip-content={t("translation")}
              className="w-4 h-4 cursor-pointer"
              onClick={handleTranslate}
            />
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
        </div>
      </div>
      <div className="flex justify-start text-xs text-muted-foreground timestamp">
        {formatDateTime(chatMessage.createdAt)}
      </div>
    </div>
  );
};

export const ChatUserMessage = (props: { chatMessage: ChatMessageType }) => {
  const { chatMessage } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const {
    chatMessages,
    askAgent,
    startRecording,
    isRecording,
    isPaused,
    setAssessing,
  } = useContext(ChatSessionProviderContext);
  const { recording } = chatMessage;
  const ref = useRef<HTMLDivElement>(null);
  const [suggestion, setSuggestion] = useState<string>();
  const [suggesting, setSuggesting] = useState<boolean>(false);
  const { refine } = useAiCommand();

  const handleSuggest = async (params?: { reload?: boolean }) => {
    if (suggesting) return;
    if (!chatMessage.content) return;

    const { reload = false } = params || {};
    const cacheKey = `chat-message-suggestion-${md5(chatMessage.id)}`;
    try {
      const cached = await EnjoyApp.cacheObjects.get(cacheKey);

      if (cached && !reload && !suggestion) {
        setSuggestion(cached);
      } else {
        setSuggesting(true);

        const context = `I'm chatting in a chatroom. The previous messages are as follows:\n\n${buildChatHistory()}`;
        const result = await refine(chatMessage.content, context);
        EnjoyApp.cacheObjects.set(cacheKey, result);
        setSuggestion(result);
        setSuggesting(false);
      }
    } catch (err) {
      toast.error(err.message);
      setSuggesting(false);
    }
  };

  const buildChatHistory = () => {
    const messages = chatMessages.filter(
      (m) => new Date(m.createdAt) < new Date(chatMessage.createdAt)
    );
    return messages
      .map(
        (message) =>
          `${(message.member.user || message.member.agent).name}: ${
            message.content
          }`
      )
      .join("\n");
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ref]);

  return (
    <div ref={ref} className="mb-6">
      <div className="flex items-center space-x-2 justify-end mb-2">
        <div className="text-sm text-muted-foreground">
          {chatMessage.member.user.name}
        </div>
        <Avatar className="w-8 h-8 bg-background avatar">
          <AvatarImage src={chatMessage.member.user.avatarUrl}></AvatarImage>
          <AvatarFallback className="bg-background">
            {chatMessage.member.user.name}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex justify-end">
        <div className="flex flex-col gap-2 px-4 py-2 mb-2 bg-sky-500/30 border-sky-500 rounded-lg shadow-sm w-full max-w-lg">
          {recording && (
            <WavesurferPlayer id={recording.id} src={recording.src} />
          )}
          {recording?.pronunciationAssessment && (
            <div className="flex justify-end">
              <PronunciationAssessmentScoreDetail
                assessment={recording.pronunciationAssessment}
              />
            </div>
          )}
          <MarkdownWrapper className="select-text prose dark:prose-invert">
            {chatMessage.content}
          </MarkdownWrapper>
          {suggestion && (
            <div className="p-4 font-serif bg-background">
              <MarkdownWrapper className="select-text prose dark:prose-invert">
                {suggestion}
              </MarkdownWrapper>
            </div>
          )}
          <div className="flex items-center space-x-4">
            {suggesting ? (
              <LoaderIcon className="w-4 h-4 animate-spin" />
            ) : (
              <SparkleIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("suggestion")}
                className="w-4 h-4 cursor-pointer"
                onClick={() => handleSuggest()}
              />
            )}
            {chatMessage.state === "pending" ? (
              <>
                {isPaused || isRecording ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <MicIcon
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("reRecord")}
                    className="w-4 h-4 cursor-pointer"
                    onClick={startRecording}
                  />
                )}
                <SendIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("confirm")}
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => askAgent()}
                />
              </>
            ) : (
              <GaugeCircleIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("pronunciationAssessment")}
                onClick={() => setAssessing(recording)}
                className="w-4 h-4 cursor-pointer"
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end text-xs text-muted-foreground timestamp">
        {formatDateTime(chatMessage.createdAt)}
      </div>
    </div>
  );
};
