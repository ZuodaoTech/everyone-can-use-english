import { createContext, useContext, useEffect, useState } from "react";
import { useChatSession, useTranscribe } from "@renderer/hooks";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { AppSettingsProviderContext } from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";

type ChatSessionProviderState = {
  chatSessions: ChatSessionType[];
  dispatchChatSessions: React.Dispatch<any>;
  currentSession: ChatSessionType;
  createChatSession: (params: any) => Promise<void>;
  updateChatMessage: (id: string, data: any) => Promise<ChatMessageType>;
  sessionSubmitting: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  togglePauseResume: () => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaRecorder: MediaRecorder;
  recordingBlob: Blob;
  askAgent: () => Promise<any>;
};

const initialState: ChatSessionProviderState = {
  chatSessions: [],
  dispatchChatSessions: () => null,
  currentSession: null,
  createChatSession: () => null,
  updateChatMessage: () => null,
  sessionSubmitting: false,
  startRecording: () => null,
  stopRecording: () => null,
  togglePauseResume: () => null,
  isRecording: false,
  isPaused: false,
  recordingTime: 0,
  mediaRecorder: null,
  recordingBlob: null,
  askAgent: () => null,
};

export const ChatSessionProviderContext =
  createContext<ChatSessionProviderState>(initialState);

export const ChatSessionProvider = ({
  children,
  chat,
}: {
  children: React.ReactNode;
  chat: ChatType;
}) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const {
    chatSessions,
    dispatchChatSessions,
    currentSession,
    createChatSession,
    updateChatMessage,
    submitting: sessionSubmitting,
    askAgent,
  } = useChatSession(chat);

  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  } = useAudioRecorder();

  const { transcribe } = useTranscribe();

  const askForMediaAccess = () => {
    EnjoyApp.system.preferences.mediaAccess("microphone").then((access) => {
      if (!access) {
        toast.warning(t("noMicrophoneAccess"));
      }
    });
  };

  const onRecorded = async (blob: Blob) => {
    try {
      const { transcript, url } = await transcribe(blob, {
        language: chat.language,
        service: chat.config.sttEngine,
        align: false,
      });

      const message = currentSession.messages.find(
        (m) => m.member.userType === "User"
      );
      if (!message) return;

      if (message.state === "pending") {
        await updateChatMessage(message.id, {
          content: transcript,
          recordingUrl: url,
        });
      } else {
        createChatSession({ transcript, recordingUrl: url });
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    askForMediaAccess();
  }, []);

  useEffect(() => {
    if (recordingBlob) {
      onRecorded(recordingBlob);
    }
  }, [recordingBlob]);

  useEffect(() => {
    if (!isRecording) return;

    if (recordingTime >= 60) {
      stopRecording();
    }
  }, [recordingTime]);

  return (
    <ChatSessionProviderContext.Provider
      value={{
        chatSessions,
        dispatchChatSessions,
        currentSession,
        createChatSession,
        updateChatMessage,
        sessionSubmitting,
        startRecording,
        stopRecording,
        togglePauseResume,
        isRecording,
        isPaused,
        recordingTime,
        mediaRecorder,
        recordingBlob,
        askAgent,
      }}
    >
      {children}
    </ChatSessionProviderContext.Provider>
  );
};
