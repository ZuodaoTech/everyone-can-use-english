import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Textarea,
  toast,
} from "@renderer/components/ui";
import {
  ConversationShortcuts,
  MarkdownWrapper,
  PronunciationAssessmentScoreDetail,
  WavesurferPlayer,
} from "@renderer/components";
import { formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  DownloadIcon,
  EditIcon,
  ForwardIcon,
  GaugeCircleIcon,
  LoaderIcon,
  MicIcon,
  MoreVerticalIcon,
  SparkleIcon,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  ChatProviderContext,
  ChatSessionProviderContext,
} from "@renderer/context";
import { useAiCommand } from "@renderer/hooks";
import { md5 } from "js-md5";
import { useCopyToClipboard } from "@uidotdev/usehooks";

export const ChatUserMessage = (props: { chatMessage: ChatMessageType }) => {
  const { chatMessage } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const {
    chatMessages,
    startRecording,
    isRecording,
    isPaused,
    setAssessing,
    onDeleteMessage,
    onUpdateMessage,
    submitting,
  } = useContext(ChatSessionProviderContext);
  const { currentChat } = useContext(ChatProviderContext);
  const { recording } = chatMessage;
  const ref = useRef<HTMLDivElement>(null);
  const [suggestion, setSuggestion] = useState<string>();
  const [suggesting, setSuggesting] = useState<boolean>(false);
  const [suggestionVisible, setSuggestionVisible] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [content, setContent] = useState<string>(chatMessage.content);
  const { refine } = useAiCommand();
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);

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
        const result = await refine(chatMessage.content, {
          learningLanguage: currentChat.language,
          context,
        });
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

  const handleDownload = () => {
    if (!chatMessage.recording) return;

    EnjoyApp.dialog
      .showSaveDialog({
        title: t("download"),
        defaultPath: chatMessage.recording.filename,
        filters: [
          {
            name: "Audio",
            extensions: [chatMessage.recording.filename.split(".").pop()],
          },
        ],
      })
      .then((savePath) => {
        if (!savePath) return;

        toast.promise(
          EnjoyApp.download.start(
            chatMessage.recording.src,
            savePath as string
          ),
          {
            loading: t("downloading", { file: chatMessage.recording.filename }),
            success: () => t("downloadedSuccessfully"),
            error: t("downloadFailed"),
            position: "bottom-right",
          }
        );
      })
      .catch((err) => {
        if (err) toast.error(err.message);
      });
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
        <div className="flex flex-col gap-2 px-4 py-2 mb-2 bg-sky-500/30 border-sky-500 rounded-lg shadow-sm w-full max-w-prose">
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
          {editing ? (
            <div className="">
              <Textarea
                className="bg-background mb-2"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={() => setEditing(false)}
                  variant="secondary"
                  size="sm"
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={() =>
                    onUpdateMessage(chatMessage.id, { content }).finally(() =>
                      setEditing(false)
                    )
                  }
                  variant="default"
                  size="sm"
                >
                  {t("save")}
                </Button>
              </div>
            </div>
          ) : (
            <MarkdownWrapper className="select-text prose dark:prose-invert">
              {chatMessage.content}
            </MarkdownWrapper>
          )}
          {suggestion && (
            <Collapsible
              open={suggestionVisible}
              onOpenChange={(value) => setSuggestionVisible(value)}
            >
              <CollapsibleContent>
                <div className="p-4 font-serif bg-background rounded">
                  <MarkdownWrapper className="select-text prose dark:prose-invert">
                    {suggestion}
                  </MarkdownWrapper>
                </div>
              </CollapsibleContent>
              <div className="my-2 flex justify-center">
                <CollapsibleTrigger asChild>
                  <Button
                    onClick={() => setSuggestionVisible(!suggestionVisible)}
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                  >
                    {suggestionVisible ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </Collapsible>
          )}
          <DropdownMenu>
            <div className="flex items-center justify-end space-x-4">
              {chatMessage.state === "pending" && (
                <>
                  <EditIcon
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("edit")}
                    className="w-4 h-4 cursor-pointer"
                    onClick={() => {
                      setContent(chatMessage.content);
                      setEditing(true);
                    }}
                  />
                  {isPaused || isRecording || submitting ? (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <MicIcon
                      data-tooltip-id="global-tooltip"
                      data-tooltip-content={t("reRecord")}
                      className="w-4 h-4 cursor-pointer"
                      onClick={startRecording}
                    />
                  )}
                </>
              )}
              {chatMessage.recording && (
                <GaugeCircleIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("pronunciationAssessment")}
                  onClick={() => setAssessing(recording)}
                  className="w-4 h-4 cursor-pointer"
                />
              )}
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
              {Boolean(chatMessage.recording) && (
                <DownloadIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("download")}
                  data-testid="chat-message-download-recording"
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
      </div>
      <div className="flex justify-end text-xs text-muted-foreground timestamp">
        {formatDateTime(chatMessage.createdAt)}
      </div>
    </div>
  );
};
