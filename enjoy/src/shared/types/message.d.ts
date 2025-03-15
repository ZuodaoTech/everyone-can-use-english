enum MessageRoleEnum {
  SYSTEM = "system",
  ASSISTANT = "assistant",
  USER = "user",
}

type MessageType = {
  id: string;
  role: MessageRoleEnum;
  content: string;
  conversationId: string;
  conversation?: ConversationType;
  createdAt?: Date;
  updatedAt?: Date;
  status?: "pending" | "success" | "error";
  speeches?: Partial<SpeechType>[];
  recording?: RecordingType;
};
