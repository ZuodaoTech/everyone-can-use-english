type ChatType = {
  id: string;
  type: "CONVERSATION" | "GROUP" | "TTS" | "STT";
  name: string;
  config: {
    sttEngine: SttEngineOptionEnum;
    prompt?: string;
    enableChatAssistant?: boolean;
    enableAutoTts?: boolean;
    [key: string]: any;
  };
  digest?: string;
  contextBreaks?: string[];
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  members: ChatMemberType[];
};

type ChatAgentType = {
  id: string;
  type: "GPT" | "TTS" | "STT";
  name: string;
  avatarUrl: string;
  description: string;
  source?: string;
  prompt?: string;
  config: {
    [key: string]: any;
  };
};

type ChatMemberType = {
  id: string;
  chatId: string;
  userId: string;
  name: string;
  userType: "ChatAgent";
  config: {
    prompt?: string;
    description?: string;
    gpt?: GptConfigType;
    tts?: TtsConfigType;
    [key: string]: any;
  };
  agent: ChatAgentType;
};

type ChatMessageType = {
  id: string;
  role: "USER" | "AGENT";
  memberId: string | null;
  chatId: string;
  content: string;
  state: "pending" | "completed";
  createdAt: Date;
  updatedAt: Date;
  member?: ChatMemberType;
  recording?: RecordingType;
  speech?: SpeechType;
};

type GptConfigType = {
  engine: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  numberOfChoices?: number;
  historyBufferSize?: number;
  [key: string]: any;
};

type TtsConfigType = {
  engine: string;
  model: string;
  language: string;
  voice: string;
  [key: string]: any;
};

type ChatDtoType = {
  type?: "CONVERSATION" | "GROUP" | "TTS" | "STT";
  name: string;
  config: {
    sttEngine: string;
    prompt?: string;
    enableChatAssistant?: boolean;
    enableAutoTts?: boolean;
  };
  members?: Array<ChatMemberDtoType>;
};

type ChatMemberDtoType = {
  userId: string;
  userType: "ChatAgent";
  config: {
    prompt?: string;
    description?: string;
    language?: string;
    gpt?: GptConfigType;
    tts?: TtsConfigType;
    [key: string]: any;
  };
};

type ChatMessageDtoType = {
  state?: "pending" | "completed";
  content?: string;
  recordingUrl?: string;
};

type ChatAgentDtoType = {
  type: "GPT" | "TTS" | "STT";
  avatarUrl?: string;
  name: string;
  description?: string;
  source?: string;
  config: {
    [key: string]: any;
  };
};
