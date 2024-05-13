type ConversationType = {
  id: string;
  type: "gpt" | "tts" | "voice";
  engine: "enjoyai" | "openai" | "ollama" | "googleGenerativeAi";
  name: string;
  configuration: { [key: string]: any };
  model: string;
  messages?: MessageType[];
  createdAt?: string;
};
