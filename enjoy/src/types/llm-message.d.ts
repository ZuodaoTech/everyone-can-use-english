type LlmMessageType = {
  id?: string;
  query?: string;
  response?: string;
  agent: LLmAgentType;
  chat: LLmChatType;
}