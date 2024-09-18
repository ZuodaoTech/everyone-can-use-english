type ChatType = {
  id: string;
  name: string;
  topic: string;
  language: string;
  config: {
    sttEngine: WhisperConfigType["service"];
    [key: string]: any;
  };
  digest?: string;
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  sessions: ChatSessionType[];
  members: ChatMemberType[];
};

type ChatAgentType = {
  id: string;
  name: string;
  avatarUrl: string;
  introduction: string;
  language: string;
  config: {
    engine: "enjoyai" | "openai";
    model: string;
    prompt: string;
    temperature?: number;
    ttsEngine: "enjoyai" | "openai";
    ttsModel: string;
    ttsVoice: string;
    [key: string]: any;
  };
};

type ChatMemberType = {
  id: string;
  chatId: string;
  userId: string;
  userType: "Agent" | "User";
  config: {
    prompt?: string;
    introduction?: string;
    [key: string]: any;
  };
  name: string;
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
