type MessageType = {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  conversationId: string;
  conversation?: ConversationType;
  createdAt?: string;
  status?: "pending" | "success" | "error";
  speeches?: Partial<SpeechType>[];
  recording?: RecordingType;
};
