type ChatType = {
  id: string;
  type: "conversation" | "group";
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
  name: string;
  avatarUrl: string;
  introduction: string;
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
  userType: "ChatAgent" | "User";
  config: {
    prompt?: string;
    introduction?: string;
    gpt?: GptConfigType;
    tts?: TtsConfigType;
    [key: string]: any;
  };
  agent?: ChatAgentType;
  user?: UserType;
};

type ChatMessageType = {
  id: string;
  memberId: string;
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
  chatId?: string;
  userId?: string;
  userType?: "User" | "ChatAgent";
  config?: {
    prompt?: string;
    introduction?: string;
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
