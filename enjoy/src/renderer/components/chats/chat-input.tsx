import {
  CheckIcon,
  LoaderIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SendIcon,
  StepForwardIcon,
  TextIcon,
  XIcon,
} from "lucide-react";
import { Button, Textarea } from "@renderer/components/ui";
import { useContext, useEffect, useRef, useState } from "react";
import { LiveAudioVisualizer } from "react-audio-visualize";
import { ChatSessionProviderContext } from "@renderer/context";
import { t } from "i18next";
import autosize from "autosize";

export const ChatInput = () => {
  const {
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
    onCreateMessage,
  } = useContext(ChatSessionProviderContext);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [inputMode, setInputMode] = useState<"text" | "audio">("audio");
  const [content, setContent] = useState("");

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

  if (isRecording) {
    return (
      <div className="w-full flex justify-center">
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
            data-tooltip-id="chat-input-tooltip"
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
                data-tooltip-id="chat-input-tooltip"
                data-tooltip-content={t("continue")}
                fill="white"
                className="w-4 h-4"
              />
            ) : (
              <PauseIcon
                data-tooltip-id="chat-input-tooltip"
                data-tooltip-content={t("pause")}
                fill="white"
                className="w-4 h-4"
              />
            )}
          </Button>
          <Button
            data-tooltip-id="chat-input-tooltip"
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
      <div className="w-full flex items-end gap-2 px-2">
        <Button
          data-tooltip-id="chat-input-tooltip"
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
          className="leading-6 bg-muted h-9 text-muted-foreground rounded-lg text-base px-3 py-1 shadow-none focus-visible:outline-0 focus-visible:ring-0 border-none min-h-[2.25rem] max-h-[70vh] scrollbar-thin !overflow-x-hidden"
        />
        <Button
          ref={submitRef}
          data-tooltip-id="chat-input-tooltip"
          data-tooltip-content={t("send")}
          onClick={() => onCreateMessage(content)}
          disabled={submitting || !content}
          className=""
          variant="ghost"
          size="icon"
        >
          {submitting ? (
            <LoaderIcon className="w-6 h-6 animate-spin" />
          ) : (
            <SendIcon className="w-6 h-6" />
          )}
        </Button>
        <Button
          data-tooltip-id="chat-input-tooltip"
          data-tooltip-content={t("continue")}
          disabled={submitting}
          onClick={() => askAgent()}
          className=""
          variant="ghost"
          size="icon"
        >
          <StepForwardIcon className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center gap-4 justify-center">
      <Button
        data-tooltip-id="chat-input-tooltip"
        data-tooltip-content={t("textInput")}
        disabled={submitting}
        onClick={() => setInputMode("text")}
        className="rounded-full shadow w-8 h-8"
        variant="secondary"
        size="icon"
      >
        <TextIcon className="w-4 h-4" />
      </Button>
      <Button
        data-tooltip-id="chat-input-tooltip"
        data-tooltip-content={t("record")}
        disabled={submitting}
        onClick={startRecording}
        className="rounded-full shadow w-10 h-10"
        size="icon"
      >
        {submitting ? (
          <LoaderIcon className="w-6 h-6 animate-spin" />
        ) : (
          <MicIcon className="w-6 h-6" />
        )}
      </Button>
      <Button
        data-tooltip-id="chat-input-tooltip"
        data-tooltip-content={t("continue")}
        disabled={submitting}
        onClick={() => askAgent()}
        className="rounded-full shadow w-8 h-8"
        variant="secondary"
        size="icon"
      >
        <StepForwardIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};
