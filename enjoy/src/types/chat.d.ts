type ChatType = {
  id: string;
  type: ChatTypeEnum;
  name: string;
  config: {
    sttEngine: SttEngineOptionEnum;
    prompt?: string;
    enableChatAssistant?: boolean;
    enableAutoTts?: boolean;
    [key: string]: any;
  };
  digest?: string;
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  members: ChatMemberType[];
};

type ChatAgentType = {
  id: string;
  type: ChatAgentTypeEnum;
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
    replyOnlyWhenMentioned?: boolean;
    gpt?: GptConfigType;
    tts?: TtsConfigType;
    [key: string]: any;
  };
  agent: ChatAgentType;
};

type ChatMessageType = {
  id: string;
  role: ChatMessageRoleEnum;
  category: ChatMessageCategoryEnum;
  memberId: string | null;
  chatId: string;
  content: string;
  state: ChatMessageStateEnum;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  member?: ChatMemberType;
  agent?: ChatAgentType;
  recording?: RecordingType;
  speech?: SpeechType;
};

type GptConfigType = {
  engine: string;
  model: string;
  temperature?: number;
  maxCompletionTokens?: number;
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
  type?: ChatTypeEnum;
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
  userId: string;
  userType: "ChatAgent";
  config: {
    prompt?: string;
    replyOnlyWhenMentioned?: boolean;
    gpt?: GptConfigType;
    tts?: TtsConfigType;
    [key: string]: any;
  };
};

type ChatMessageDtoType = {
  state?: ChatMessageStateEnum;
  content?: string;
  recordingUrl?: string;
};

type ChatAgentDtoType = {
  type: ChatAgentTypeEnum;
  avatarUrl?: string;
  name: string;
  description?: string;
  source?: string;
  config: {
    [key: string]: any;
  };
};
