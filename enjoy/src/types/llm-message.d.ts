type LlmMessageType = {
  id: string;
  query: string;
  responst?: string;
  agent: LLmAgentType;
  chat: LLmChatType;
}