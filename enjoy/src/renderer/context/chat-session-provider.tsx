import { createContext, useContext, useEffect, useState } from "react";
import { useChatMessage, useTranscribe } from "@renderer/hooks";
import { useAudioRecorder } from "react-audio-voice-recorder";
import {
  AISettingsProviderContext,
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
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChevronDownIcon } from "lucide-react";
import { AudioPlayer, RecordingDetail } from "@renderer/components";
import { CHAT_SYSTEM_PROMPT_TEMPLATE } from "@/constants";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type ChatSessionProviderState = {
  chatMessages: ChatMessageType[];
  dispatchChatMessages: React.Dispatch<any>;
  submitting: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
  togglePauseResume: () => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaRecorder: MediaRecorder;
  recordingBlob: Blob;
  askAgent: () => Promise<any>;
  shadowing: AudioType;
  setShadowing: (audio: AudioType) => void;
  assessing: RecordingType;
  setAssessing: (recording: RecordingType) => void;
  onDeleteMessage?: (id: string) => void;
  onCreateMessage?: (
    content: string,
    recordingUrl?: string
  ) => Promise<ChatMessageType | void>;
  onUpdateMessage?: (
    id: string,
    data: Partial<ChatMessageType>
  ) => Promise<ChatMessageType>;
};

const initialState: ChatSessionProviderState = {
  chatMessages: [],
  dispatchChatMessages: () => null,
  submitting: false,
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
  chat,
}: {
  children: React.ReactNode;
  chat: ChatType;
}) => {
  const { EnjoyApp, user, apiUrl, recorderConfig } = useContext(
    AppSettingsProviderContext
  );
  const { openai } = useContext(AISettingsProviderContext);
  const [submitting, setSubmitting] = useState(false);
  const [shadowing, setShadowing] = useState<AudioType>(null);
  const [assessing, setAssessing] = useState<RecordingType>(null);
  const {
    chatMessages,
    dispatchChatMessages,
    onCreateUserMessage,
    onUpdateMessage,
    onDeleteMessage,
  } = useChatMessage(chat);
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

  const onCreateMessage = async (content: string, recordingUrl?: string) => {
    if (submitting) return;

    setSubmitting(true);
    return onCreateUserMessage(content, recordingUrl).finally(() =>
      setSubmitting(false)
    );
  };

  const onRecorded = async (blob: Blob) => {
    if (cancelingRecording) {
      setCancelingRecording(false);
      return;
    }
    if (submitting) return;

    try {
      setSubmitting(true);
      const { transcript, url } = await transcribe(blob, {
        language: chat.language,
        service: chat.config.sttEngine,
        align: false,
      });
      return onCreateMessage(transcript, url).finally(() =>
        setSubmitting(false)
      );
    } catch (error) {
      toast.error(error.message);
      setSubmitting(false);
    }
  };

  const askAgent = async (member?: ChatMemberType) => {
    // check if there is a pending message
    const pendingMessage = chatMessages.find(
      (m) => m.member.user && m.state === "pending"
    );
    if (pendingMessage) {
      onUpdateMessage(pendingMessage.id, { state: "completed" });
    }

    // pick an random agent
    if (!member) {
      const members = chat.members.filter(
        (member) =>
          member.userType === "Agent" &&
          member.id !== chatMessages[chatMessages.length - 1]?.member?.id
      );
      member = members[Math.floor(Math.random() * members.length)];
    }

    if (!member) {
      return toast.warning(t("itsYourTurn"));
    }

    try {
      const llm = buildLlm(member.agent);
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", CHAT_SYSTEM_PROMPT_TEMPLATE],
        ["user", "{input}"],
      ]);
      const chain = prompt.pipe(llm);

      setSubmitting(true);
      const lastChatMessage = chatMessages[chatMessages.length - 1];
      const reply = await chain.invoke({
        name: member.agent.name,
        agent_prompt: member.agent.config.prompt || "",
        agent_chat_prompt: member.config.prompt || "",
        language: chat.language,
        topic: chat.topic,
        members: chat.members
          .map((m) => {
            if (m.user) {
              return `- ${m.user.name} (${m.config.introduction})`;
            } else if (m.agent) {
              return `- ${m.agent.name} (${m.agent.introduction})`;
            }
          })
          .join("\n"),
        history: chatMessages
          .slice(0, chatMessages.length - 1)
          .map(
            (message) =>
              `- ${(message.member.user || message.member.agent).name}: ${
                message.content
              }(${dayjs(message.createdAt).fromNow()})`
          )
          .join("\n"),
        input:
          (lastChatMessage
            ? `${lastChatMessage.member.name}: ${lastChatMessage.content}\n`
            : "") + `${member.agent.name}:`,
      });

      // the reply may contain the member's name like "Agent: xxx". We need to remove it.
      const content = reply.content
        .toString()
        .replace(new RegExp(`^(${member.agent.name}):`), "")
        .trim();

      return EnjoyApp.chatMessages
        .create({
          chatId: chat.id,
          memberId: member.id,
          content,
          state: "completed",
        })
        .then((message) =>
          dispatchChatMessages({ type: "append", record: message })
        )
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => setSubmitting(false));
    } catch (err) {
      setSubmitting(false);
      toast.error(err.message);
    }
  };

  const buildLlm = (agent: ChatAgentType) => {
    const { engine, model, temperature } = agent.config;

    if (engine === "enjoyai") {
      return new ChatOpenAI({
        openAIApiKey: user.accessToken,
        configuration: {
          baseURL: `${apiUrl}/api/ai`,
        },
        maxRetries: 0,
        modelName: model,
        temperature,
      });
    } else if (engine === "openai") {
      return new ChatOpenAI({
        openAIApiKey: openai.key,
        configuration: {
          baseURL: openai.baseUrl,
        },
        maxRetries: 0,
        modelName: model,
        temperature,
      });
    }
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

  return (
    <ChatSessionProviderContext.Provider
      value={{
        chatMessages,
        dispatchChatMessages,
        submitting,
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
        {children}

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
    </ChatSessionProviderContext.Provider>
  );
};
