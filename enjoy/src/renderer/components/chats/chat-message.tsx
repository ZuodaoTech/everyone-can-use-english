import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from "@renderer/components/ui";
import { MarkdownWrapper, WavesurferPlayer } from "@renderer/components";
import { formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import { MicIcon, SquareIcon } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { ChatSessionProviderContext } from "@renderer/context";

export const ChatMessage = (props: { chatMessage: ChatMessageType }) => {
  if (props.chatMessage.member.userType === "User") {
    return <ChatUserMessage chatMessage={props.chatMessage} />;
  } else if (props.chatMessage.member.userType === "Agent") {
    return <ChatAgentMessage chatMessage={props.chatMessage} />;
  }
};

export const ChatAgentMessage = (props: { chatMessage: ChatMessageType }) => {
  const { chatMessage } = props;
  const { agent } = chatMessage.member || {};
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ref]);

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
        <MarkdownWrapper className="select-text prose dark:prose-invert">
          {chatMessage.content}
        </MarkdownWrapper>
      </div>
      <div className="flex justify-start text-xs text-muted-foreground timestamp">
        {formatDateTime(chatMessage.createdAt)}
      </div>
    </div>
  );
};

export const ChatUserMessage = (props: { chatMessage: ChatMessageType }) => {
  const { chatMessage } = props;
  const {
    askAgent,
    startRecording,
    stopRecording,
    isRecording,
    isPaused,
    updateChatMessage,
  } = useContext(ChatSessionProviderContext);
  const { recording } = chatMessage;
  const ref = useRef<HTMLDivElement>(null);

  const confirmRecording = async () => {
    updateChatMessage(chatMessage.id, {
      state: "completed",
    }).then(() => askAgent());
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
          <MarkdownWrapper className="select-text prose dark:prose-invert">
            {chatMessage.content}
          </MarkdownWrapper>
          <div className="w-full flex items-center justify-end space-x-2">
            {chatMessage.state === "pending" && (
              <>
                <Button size="sm" variant="secondary">
                  {t("refine")}
                </Button>
                {isPaused || isRecording ? (
                  <Button onClick={stopRecording} size="sm" variant="default">
                    <SquareIcon
                      fill="white"
                      className="w-4 h-4 text-white mr-2"
                    />
                    {t("stop")}
                  </Button>
                ) : (
                  <Button
                    onClick={startRecording}
                    size="sm"
                    variant="secondary"
                  >
                    <MicIcon className="w-4 h-4 mr-2" />
                    {t("reRecord")}
                  </Button>
                )}
                <Button onClick={confirmRecording} size="sm" variant="default">
                  {t("confirm")}
                </Button>
              </>
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
