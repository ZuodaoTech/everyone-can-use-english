import {
  LoaderIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
  StepForwardIcon,
} from "lucide-react";
import { Button } from "@renderer/components/ui";
import { useContext } from "react";
import { LiveAudioVisualizer } from "react-audio-visualize";
import { ChatSessionProviderContext } from "@renderer/context";
import { t } from "i18next";

export const ChatInput = () => {
  const {
    submitting,
    startRecording,
    stopRecording,
    togglePauseResume,
    isRecording,
    mediaRecorder,
    recordingTime,
    isPaused,
    askAgent,
  } = useContext(ChatSessionProviderContext);

  if (submitting) {
    return (
      <div className="w-full flex justify-center">
        <LoaderIcon className="w-6 h-6 animate-spin" />
      </div>
    );
  }

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
            onClick={togglePauseResume}
            className="rounded-full shadow w-8 h-8"
            size="icon"
          >
            {isPaused ? (
              <PlayIcon fill="white" className="w-4 h-4" />
            ) : (
              <PauseIcon fill="white" className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={stopRecording}
            className="rounded-full bg-red-500 hover:bg-red-600 shadow w-8 h-8"
            size="icon"
          >
            <SquareIcon fill="white" className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex gap-4 justify-center">
      <Button
        onClick={startRecording}
        className="rounded-full shadow w-10 h-10"
        size="icon"
      >
        <MicIcon className="w-6 h-6" />
      </Button>
      <Button
        onClick={askAgent}
        className="rounded-full shadow w-auto h-10"
        size="sm"
      >
        <StepForwardIcon className="w-6 h-6 mr-2" />
        {t("continue")}
      </Button>
    </div>
  );
};
