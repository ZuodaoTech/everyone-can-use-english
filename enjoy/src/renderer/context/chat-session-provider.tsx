import { createContext, useContext, useEffect, useState } from "react";
import { useChatSession, useTranscribe } from "@renderer/hooks";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { AppSettingsProviderContext } from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";

type ChatSessionProviderState = {
  chatSessions: ChatSessionType[];
  currentSession: ChatSessionType;
  createChatSession: (params: any) => Promise<ChatSessionType>;
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

  const askForMediaAccess = () => {
    EnjoyApp.system.preferences.mediaAccess("microphone").then((access) => {
      if (!access) {
        toast.warning(t("noMicrophoneAccess"));
      }
    });
  };

  useEffect(() => {
    askForMediaAccess();
  }, []);

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
