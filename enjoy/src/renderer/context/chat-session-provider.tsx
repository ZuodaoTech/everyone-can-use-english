import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useChatMessage, useTranscribe } from "@renderer/hooks";
import { useAudioRecorder } from "react-audio-voice-recorder";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  MediaPlayerProvider,
} from "@renderer/context";
import {
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

type ChatSessionProviderState = {
  chatMessages: ChatMessageType[];
  dispatchChatMessages: React.Dispatch<any>;
  submitting: boolean;
  startRecording: () => void;
  stopRecording: () => void;
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
};

const initialState: ChatSessionProviderState = {
  chatMessages: [],
  dispatchChatMessages: () => null,
  submitting: false,
  startRecording: () => null,
  stopRecording: () => null,
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
  const { EnjoyApp, user, apiUrl } = useContext(AppSettingsProviderContext);
  const { openai } = useContext(AISettingsProviderContext);
  const [submitting, setSubmitting] = useState(false);
  const [shadowing, setShadowing] = useState<AudioType>(null);
  const [assessing, setAssessing] = useState<RecordingType>(null);
  const { chatMessages, dispatchChatMessages } = useChatMessage(chat);

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

      const pendingMessage = chatMessages.find(
        (m) => m.member.userType === "User" && m.state === "pending"
      );

      setSubmitting(true);
      if (pendingMessage) {
        return EnjoyApp.chatMessages
          .update(pendingMessage.id, {
            content: transcript,
            recordingUrl: url,
          })
          .finally(() => setSubmitting(false));
      } else {
        EnjoyApp.chatMessages
          .create({
            chatId: chat.id,
            memberId: chat.members.find((m) => m.userType === "User").id,
            content: transcript,
            state: "pending",
            recordingUrl: url,
          })
          .finally(() => setSubmitting(false));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const askAgent = async (member?: ChatMemberType) => {
    // check if there is a pending message
    const pendingMessage = chatMessages.find(
      (m) => m.member.user && m.state === "pending"
    );
    if (pendingMessage) {
      EnjoyApp.chatMessages.update(pendingMessage.id, { state: "completed" });
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

    const llm = buildLlm(member.agent);
    const systemPrompt = buildAgentPrompt(member);
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "{input}"],
    ]);
    const chain = prompt.pipe(llm);
    try {
      setSubmitting(true);
      const reply = await chain.invoke({
        input: "Just return what you would say. No need to include others.",
      });

      return EnjoyApp.chatMessages
        .create({
          chatId: chat.id,
          memberId: member.id,
          content: reply.content,
          state: "completed",
        })
        .finally(() => setSubmitting(false));
    } catch (err) {
      setSubmitting(false);
      toast.error(err.message);
    }
  };

  const buildAgentPrompt = (member: ChatMemberType) => {
    return `You are ${member.agent.name}. ${member.agent.config.prompt}
You are chatting in an online chatroom. You always reply in ${chat.language}.
${member.config.prompt || ""}

<Chat Topic>
${chat.topic}

<Chat Members>
${chat.members
  .map((m) => {
    if (m.user) {
      return `- ${m.user.name} (${m.config.introduction})`;
    } else if (m.agent) {
      return `- ${m.agent.name} (${m.agent.introduction})`;
    }
  })
  .join("\n")}

<Chat History>
${buildChatHistory()}`;
  };

  const buildChatHistory = () => {
    return chatMessages
      .map(
        (message) =>
          `${(message.member.user || message.member.agent).name}: ${
            message.content
          }`
      )
      .join("\n");
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
        chatMessages,
        dispatchChatMessages,
        submitting,
        startRecording,
        stopRecording,
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
      }}
    >
      <MediaPlayerProvider>
        {children}
        <Sheet
          modal={false}
          open={Boolean(shadowing)}
          onOpenChange={(value) => {
            if (!value) setShadowing(null);
          }}
        >
          <SheetContent
            side="bottom"
            className="h-screen p-0"
            displayClose={false}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <SheetHeader className="flex items-center justify-center h-14">
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
              />
            )}
          </SheetContent>
        </Sheet>
      </MediaPlayerProvider>
    </ChatSessionProviderContext.Provider>
  );
};
