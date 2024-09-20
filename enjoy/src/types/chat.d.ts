type ChatType = {
  id: string;
  type: "conversation" | "group";
  name: string;
  topic?: string;
  config: {
    sttEngine: SttEngineOptionEnum;
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
  userType: "Agent" | "User";
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
  engine: "enjoyai" | "openai";
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  numberOfChoices?: number;
  historyBufferSize?: number;
  [key: string]: any;
};

type TtsConfigType = {
  engine: "enjoyai" | "openai";
  model: string;
  language: string;
  voice: string;
  [key: string]: any;
};
