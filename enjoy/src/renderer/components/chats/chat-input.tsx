import {
  ArrowUpIcon,
  CheckIcon,
  LoaderIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  StepForwardIcon,
  TypeIcon,
  WandIcon,
  XIcon,
} from "lucide-react";
import { Button, Textarea } from "@renderer/components/ui";
import { useContext, useEffect, useRef, useState } from "react";
import { LiveAudioVisualizer } from "react-audio-visualize";
import {
  AppSettingsProviderContext,
  ChatSessionProviderContext,
  HotKeysSettingsProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import autosize from "autosize";
import { ChatMentioning, ChatSuggestionButton } from "@renderer/components";
import { useHotkeys } from "react-hotkeys-hook";
import { ChatTypeEnum } from "@/types/enums";

export const ChatInput = () => {
  const {
    chat,
    submitting,
    startRecording,
    stopRecording,
    cancelRecording,
    togglePauseResume,
    isRecording,
    mediaRecorder,
    recordingTime,
    isPaused,
    askAgent,
    createMessage,
    shadowing,
    chatAgents,
  } = useContext(ChatSessionProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [inputMode, setInputMode] = useState<"text" | "audio">("text");
  const [content, setContent] = useState("");
  const { currentHotkeys } = useContext(HotKeysSettingsProviderContext);
  const [mentioned, setMentioned] = useState<ChatAgentType[]>([]);

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
  }, [inputRef.current]);

  useEffect(() => {
    if (content) return;

    const evt = new CustomEvent("autosize:update", {
      bubbles: true,
      cancelable: false,
    });
    inputRef.current?.dispatchEvent(evt);
  }, [content]);

  useEffect(() => {
    EnjoyApp.cacheObjects
      .get(`chat-input-mode-${chat.id}`)
      .then((cachedInputMode) => {
        if (cachedInputMode) {
          setInputMode(cachedInputMode as typeof inputMode);
        }
      });
  }, []);

  useEffect(() => {
    EnjoyApp.cacheObjects.set(`chat-input-mode-${chat.id}`, inputMode);
  }, [inputMode]);

  useHotkeys(
    currentHotkeys.StartOrStopRecording,
    () => {
      if (shadowing) return;
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    },
    {
      preventDefault: true,
    }
  );

  useHotkeys(
    currentHotkeys.PlayNextSegment,
    () => {
      if (shadowing) return;
      askAgent({ force: true });
    },
    {
      preventDefault: true,
    }
  );

  if (isRecording) {
    return (
      <div className="z-10 w-full flex justify-center">
        <div className="flex items-center space-x-2">
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            barWidth={2}
            gap={2}
            width={140}
            height={30}
            fftSize={512}
            maxDecibels={-10}
            minDecibels={-80}
            smoothingTimeConstant={0.4}
          />
          <span className="text-sm text-muted-foreground">
            {Math.floor(recordingTime / 60)}:
            {String(recordingTime % 60).padStart(2, "0")}
          </span>
          <Button
            data-tooltip-id={`${chat.id}-tooltip`}
            data-tooltip-content={t("cancel")}
            onClick={cancelRecording}
            className="rounded-full shadow w-8 h-8 bg-red-500 hover:bg-red-600"
            variant="secondary"
            size="icon"
          >
            <XIcon fill="white" className="w-4 h-4 text-white" />
          </Button>
          <Button
            onClick={togglePauseResume}
            className="rounded-full shadow w-8 h-8"
            size="icon"
          >
            {isPaused ? (
              <PlayIcon
                data-tooltip-id={`${chat.id}-tooltip`}
                data-tooltip-content={t("continue")}
                fill="white"
                className="w-4 h-4"
              />
            ) : (
              <PauseIcon
                data-tooltip-id={`${chat.id}-tooltip`}
                data-tooltip-content={t("pause")}
                fill="white"
                className="w-4 h-4"
              />
            )}
          </Button>
          <Button
            data-tooltip-id={`${chat.id}-tooltip`}
            data-tooltip-content={t("finish")}
            onClick={stopRecording}
            className="rounded-full bg-green-500 hover:bg-green-600 shadow w-8 h-8"
            size="icon"
          >
            <CheckIcon className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    );
  }

  if (inputMode === "text") {
    return (
      <ChatMentioning
        input={content}
        members={chatAgents}
        mentioned={mentioned.map((chatAgent) => chatAgent.id)}
        onMention={(chatAgent) => {
          setMentioned([...mentioned, chatAgent]);
        }}
        onRemove={(chatAgent) => {
          setMentioned(mentioned.filter((ca) => ca.id !== chatAgent.id));
        }}
        onCancel={() => setContent("")}
      >
        <div className="z-10 w-full mx-4">
          {mentioned.length > 0 && (
            <div className="w-full bg-purple-300 rounded px-4 py-2 mb-1 opacity-80 hover:opacity-100">
              {mentioned.map((chatAgent) => (
                <div
                  className="flex items-center justify-between"
                  key={chatAgent.id}
                >
                  <div className="text-sm text-purple-700">
                    {chatAgents.findIndex((ca) => ca.id === chatAgent.id) > -1
                      ? t("askAgentToReply", { name: chatAgent.name })
                      : t("inviteAgentInChatAndReply", {
                          name: chatAgent.name,
                        })}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-purple-700 hover:bg-transparent hover:text-purple-900"
                    onClick={() =>
                      setMentioned(
                        mentioned.filter((ca) => ca.id !== chatAgent.id)
                      )
                    }
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="w-full flex items-end gap-2 px-2 py-2 bg-muted rounded-3xl shadow-lg">
            <Button
              data-tooltip-id={`${chat.id}-tooltip`}
              data-tooltip-content={t("audioInput")}
              disabled={submitting}
              onClick={() => setInputMode("audio")}
              variant="ghost"
              className=""
              size="icon"
            >
              <MicIcon className="w-6 h-6" />
            </Button>
            <Textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
              placeholder={t("pressEnterToSend")}
              data-testid="chat-input"
              className="flex-1 h-8 text-muted-foreground rounded-lg text-sm leading-7 px-0 py-1 shadow-none focus-visible:outline-0 focus-visible:ring-0 border-none min-h-[2.25rem] max-h-[70vh] scrollbar-thin !overflow-x-hidden"
            />
            <Button
              ref={submitRef}
              data-tooltip-id={`${chat.id}-tooltip`}
              data-tooltip-content={t("send")}
              onClick={() =>
                createMessage(content, {
                  mentions: mentioned.map((m) => m.id),
                  onSuccess: () => setContent(""),
                })
              }
              disabled={submitting || !content.trim() || content === "@"}
              className="rounded-full shadow w-8 h-8"
              variant="default"
              size="icon"
            >
              {submitting ? (
                <LoaderIcon className="w-6 h-6 animate-spin" />
              ) : (
                <ArrowUpIcon className="w-6 h-6" />
              )}
            </Button>
            {chat.config.enableChatAssistant && (
              <ChatSuggestionButton chat={chat} asChild>
                <Button
                  data-tooltip-id={`${chat.id}-tooltip`}
                  data-tooltip-content={t("suggestion")}
                  className="rounded-full w-8 h-8"
                  variant="ghost"
                  size="icon"
                >
                  <WandIcon className="w-6 h-6" />
                </Button>
              </ChatSuggestionButton>
            )}

            {chat.type === ChatTypeEnum.GROUP && (
              <Button
                data-tooltip-id={`${chat.id}-tooltip`}
                data-tooltip-content={t("continue")}
                disabled={submitting}
                onClick={() => askAgent({ force: true })}
                className=""
                variant="ghost"
                size="icon"
              >
                <StepForwardIcon className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </ChatMentioning>
    );
  }

  return (
    <div className="w-full flex items-center gap-4 justify-center relative">
      <Button
        data-tooltip-id={`${chat.id}-tooltip`}
        data-tooltip-content={t("textInput")}
        disabled={submitting}
        onClick={() => setInputMode("text")}
        className="rounded-full shadow-lg w-8 h-8"
        variant="secondary"
        size="icon"
      >
        <TypeIcon className="w-4 h-4" />
      </Button>
      <Button
        data-tooltip-id={`${chat.id}-tooltip`}
        data-tooltip-content={t("record")}
        disabled={submitting}
        onClick={startRecording}
        className="rounded-full shadow-lg w-10 h-10"
        size="icon"
      >
        {submitting ? (
          <LoaderIcon className="w-6 h-6 animate-spin" />
        ) : (
          <MicIcon className="w-6 h-6" />
        )}
      </Button>
      {chat.config.enableChatAssistant && <ChatSuggestionButton chat={chat} />}
      {chat.type === ChatTypeEnum.GROUP && (
        <Button
          data-tooltip-id={`${chat.id}-tooltip`}
          data-tooltip-content={t("continue")}
          disabled={submitting}
          onClick={() => askAgent({ force: true })}
          className="rounded-full shadow-lg w-8 h-8"
          variant="default"
          size="icon"
        >
          <StepForwardIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
