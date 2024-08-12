import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useTranscribe } from "@renderer/hooks";
import { useAudioRecorder } from "react-audio-voice-recorder";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { toast } from "@renderer/components/ui";
import { t } from "i18next";
import { chatMessagesReducer } from "@renderer/reducers";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

type ChatSessionProviderState = {
  chatMessages: ChatMessageType[];
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
};

const initialState: ChatSessionProviderState = {
  chatMessages: [],
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
  const [chatMessages, dispatchChatMessages] = useReducer(
    chatMessagesReducer,
    []
  );
  const [submitting, setSubmitting] = useState(false);

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

      const message = chatMessages.find(
        (m) => m.member.userType === "User" && m.state === "pending"
      );
      if (message) {
      } else {
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const askAgent = async () => {
    const userMessage = chatMessages.find((m) => m.member.user);
    if (userMessage && userMessage.state !== "completed") {
    }
    const member = chat.members.find(
      (member) =>
        member.userType === "Agent" &&
        chatMessages.findIndex((m) => m.member.userId === member.userId) === -1
    );

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
        input: "What would you say? Turn the content only.",
      });

      return EnjoyApp.chatMessages
        .create({
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
    return `You are @${member.agent.name}. ${member.agent.config.prompt}
You are chatting in a chat room. You always reply in ${chat.language}.
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
${buildChatHistory()}
`;
  };

  const buildChatHistory = () => {
    return chatMessages
      .map(
        (message) =>
          `@${(message.member.user || message.member.agent).name}: ${
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
      }}
    >
      {children}
    </ChatSessionProviderContext.Provider>
  );
};
