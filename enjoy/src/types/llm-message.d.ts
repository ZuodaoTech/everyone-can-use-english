type LlmMessageType = {
  id?: string;
  query?: string;
  response?: string;
  agent: LLmAgentType;
  user?: UserType;
  chat: LLmChatType;
  createdAt?: string;
  updatedAt?: string;
};
