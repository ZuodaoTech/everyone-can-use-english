import { createContext, useContext, useEffect, useState } from "react";
import { useAiCommand, useChatSession, useTranscribe } from "@renderer/hooks";
import { useAudioRecorder } from "react-audio-voice-recorder";
import {
  AppSettingsProviderContext,
  MediaShadowProvider,
} from "@renderer/context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { ChevronDownIcon } from "lucide-react";
import { AudioPlayer, RecordingDetail } from "@renderer/components";
import { Tooltip } from "react-tooltip";
import { ChatMessageRoleEnum, ChatMessageStateEnum } from "@/types/enums";

type ChatSessionProviderState = {
  chat: ChatType;
  chatMessages: ChatMessageType[];
  chatMembers: ChatMemberType[];
  chatAgents: ChatAgentType[];
  dispatchChatMessages: React.Dispatch<any>;
  submitting: boolean;
  asking: ChatMemberType;
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
  togglePauseResume: () => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaRecorder: MediaRecorder;
  recordingBlob: Blob;
  askAgent: (options?: {
    member?: ChatMemberType;
    force?: boolean;
  }) => Promise<any>;
  shadowing: AudioType;
  setShadowing: (audio: AudioType) => void;
  assessing: RecordingType;
  setAssessing: (recording: RecordingType) => void;
  onDeleteMessage?: (id: string) => void;
  onCreateMessage?: (
    content: string,
    options: {
      onSuccess?: (message: ChatMessageType) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<ChatMessageType | void>;
  onUpdateMessage?: (
    id: string,
    data: Partial<ChatMessageType>
  ) => Promise<ChatMessageType>;
};

const initialState: ChatSessionProviderState = {
  chat: null,
  chatMessages: [],
  chatMembers: [],
  chatAgents: [],
  dispatchChatMessages: () => null,
  submitting: false,
  asking: null,
  startRecording: () => null,
  stopRecording: () => null,
  cancelRecording: () => null,
  togglePauseResume: () => null,
  isRecording: false,
  isPaused: false,
  recordingTime: 0,
  mediaRecorder: null,
  recordingBlob: null,
  askAgent: () => null,
  shadowing: null,
  setShadowing: () => null,
  assessing: null,
  setAssessing: () => null,
  onCreateMessage: () => null,
  onUpdateMessage: () => null,
};

export const ChatSessionProviderContext =
  createContext<ChatSessionProviderState>(initialState);

export const ChatSessionProvider = ({
  children,
  chatId,
}: {
  children: React.ReactNode;
  chatId: string;
}) => {
  const { EnjoyApp, recorderConfig, learningLanguage } = useContext(
    AppSettingsProviderContext
  );
  const [submitting, setSubmitting] = useState(false);
  const [shadowing, setShadowing] = useState<AudioType>(null);
  const [asking, setAsking] = useState<ChatMemberType>(null);
  const [assessing, setAssessing] = useState<RecordingType>(null);
  const {
    chat,
    chatAgents,
    chatMembers,
    chatMessages,
    dispatchChatMessages,
    onCreateUserMessage,
    onUpdateMessage,
    onDeleteMessage,
    invokeAgent,
  } = useChatSession(chatId);

  const [deletingMessage, setDeletingMessage] = useState<string>(null);
  const [cancelingRecording, setCancelingRecording] = useState(false);

  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  } = useAudioRecorder(recorderConfig, (exception) => {
    toast.error(exception.message);
  });

  const { transcribe } = useTranscribe();
  const { summarizeTopic } = useAiCommand();

  const cancelRecording = () => {
    setCancelingRecording(true);
  };

  const askForMediaAccess = () => {
    EnjoyApp.system.preferences.mediaAccess("microphone").then((access) => {
      if (!access) {
        toast.warning(t("noMicrophoneAccess"));
      }
    });
  };

  const onCreateMessage = async (
    content: string,
    options: {
      onSuccess?: (message: ChatMessageType) => void;
      onError?: (error: Error) => void;
    } = {}
  ) => {
    const { onSuccess, onError } = options;
    if (submitting) return;

    setSubmitting(true);
    onCreateUserMessage(content)
      .then((message) => {
        if (message) {
          onSuccess?.(message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
        onError?.(error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const onRecorded = async (blob: Blob) => {
    if (cancelingRecording) {
      setCancelingRecording(false);
      return;
    }
    if (submitting) return;

    const pendingMessage = chatMessages.find(
      (m) =>
        m.role === ChatMessageRoleEnum.USER &&
        m.state === ChatMessageStateEnum.PENDING
    );

    try {
      setSubmitting(true);
      const { transcript, url } = await transcribe(blob, {
        language: learningLanguage,
        service: chat.config.sttEngine,
        align: false,
      });

      if (pendingMessage) {
        await onUpdateMessage(pendingMessage.id, {
          content: transcript,
          recordingUrl: url,
        });
      } else {
        await onCreateUserMessage(transcript, url);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const askAgent = async (options?: {
    member?: ChatMemberType;
    force?: boolean;
  }) => {
    if (asking) return;

    let { member, force = false } = options || {};

    if (!member) {
      member = pickNextAgentMember();
    }

    // In a group chat, agents may talk to each other.
    if (!member && force && chat.members.length > 1) {
      member = chat.members.find(
        (m) =>
          m.userType === "ChatAgent" &&
          m.id !== chatMessages[chatMessages.length - 1]?.member?.id
      );
    }

    if (!member) {
      return;
    }

    setSubmitting(true);
    setAsking(member);
    try {
      await invokeAgent(member.id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
      setAsking(null);
    }
  };

  const pickNextAgentMember = () => {
    const members = chat.members;
    const messages = chatMessages.filter(
      (m) =>
        m.role === ChatMessageRoleEnum.AGENT ||
        m.role === ChatMessageRoleEnum.USER
    );
    let currentIndex = messages.length - 1;
    const spokeMembers = new Set();

    while (currentIndex >= 0) {
      const message = messages[currentIndex];
      if (
        message.role === ChatMessageRoleEnum.AGENT &&
        spokeMembers.has(message.member?.id)
      ) {
        break;
      }
      if (message.role === ChatMessageRoleEnum.USER) {
        break;
      }
      if (!message.member) break;

      spokeMembers.add(message.member.id);
      currentIndex--;
    }

    // pick a member that has not spoken yet
    const nextMember = members.find((member) => !spokeMembers.has(member.id));

    return nextMember;
  };

  const onAssess = (assessment: PronunciationAssessmentType) => {
    const message = chatMessages.find(
      (m) => m.recording?.id === assessment.targetId
    );
    if (!message) return;

    dispatchChatMessages({
      type: "update",
      record: {
        ...message,
        recording: {
          ...message.recording,
          pronunciationAssessment: assessment,
        },
      },
    });
  };

  const updateChatName = async () => {
    if (
      chatMessages.filter((m) => m.role === ChatMessageRoleEnum.AGENT).length <
      1
    )
      return;

    const content = chatMessages
      .filter(
        (m) =>
          m.role === ChatMessageRoleEnum.AGENT ||
          m.role === ChatMessageRoleEnum.USER
      )
      .slice(0, 10)
      .map((m) => m.content)
      .join("\n");
    try {
      const topic = await summarizeTopic(content);
      if (topic) {
        EnjoyApp.chats.update(chat.id, { name: topic });
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
    if (cancelingRecording) {
      stopRecording();
    }
  }, [cancelingRecording]);

  useEffect(() => {
    if (!isRecording) return;

    if (recordingTime >= 60) {
      stopRecording();
    }
  }, [recordingTime]);

  useEffect(() => {
    if (!chat) return;

    // Automatically update the chat name
    if (
      chat.name === t("newChat") &&
      chatMessages.filter((m) => m.role === ChatMessageRoleEnum.AGENT).length >
        0
    ) {
      updateChatName();
    }
  }, [chatMessages]);

  return (
    <ChatSessionProviderContext.Provider
      value={{
        chat,
        chatMessages,
        chatMembers,
        chatAgents,
        dispatchChatMessages,
        submitting,
        asking,
        startRecording,
        stopRecording,
        cancelRecording,
        togglePauseResume,
        isRecording,
        isPaused,
        recordingTime,
        mediaRecorder,
        recordingBlob,
        askAgent,
        shadowing,
        setShadowing,
        assessing,
        setAssessing,
        onDeleteMessage: (id) => setDeletingMessage(id),
        onCreateMessage,
        onUpdateMessage,
      }}
    >
      <MediaShadowProvider>
        {chat && children}

        <AlertDialog
          open={Boolean(deletingMessage)}
          onOpenChange={(value) => {
            if (!value) setDeletingMessage(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteMessage")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteMessageConfirmation")}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDeleteMessage(deletingMessage)}
              >
                {t("confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Sheet
          modal={false}
          open={Boolean(shadowing)}
          onOpenChange={(value) => {
            if (!value) setShadowing(null);
          }}
        >
          <SheetContent
            side="bottom"
            className="h-screen p-0 flex flex-col"
            displayClose={false}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <SheetHeader className="flex items-center justify-center">
              <SheetTitle className="sr-only">Shadow</SheetTitle>
              <SheetDescription className="sr-only"></SheetDescription>
              <SheetClose>
                <ChevronDownIcon />
              </SheetClose>
            </SheetHeader>

            <AudioPlayer id={shadowing?.id} />
          </SheetContent>
        </Sheet>

        <Sheet
          open={Boolean(assessing)}
          onOpenChange={(value) => {
            if (!value) setAssessing(null);
          }}
        >
          <SheetContent
            aria-describedby={undefined}
            side="bottom"
            className="rounded-t-2xl shadow-lg max-h-screen overflow-y-scroll"
            displayClose={false}
          >
            <SheetHeader className="flex items-center justify-center -mt-4 mb-2">
              <SheetTitle className="sr-only">Assessment</SheetTitle>
              <SheetClose>
                <ChevronDownIcon />
              </SheetClose>
            </SheetHeader>
            {assessing && (
              <RecordingDetail
                recording={assessing}
                pronunciationAssessment={assessing.pronunciationAssessment}
                onAssess={onAssess}
              />
            )}
          </SheetContent>
        </Sheet>
      </MediaShadowProvider>
      <Tooltip id={`${chatId}-tooltip`} />
    </ChatSessionProviderContext.Provider>
  );
};
