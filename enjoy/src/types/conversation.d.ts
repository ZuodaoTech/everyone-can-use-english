type ConversationType = {
  id: string;
  engine: "enjoyai" | "openai" | "ollama" | "googleGenerativeAi";
  name: string;
  configuration: { [key: string]: any };
  model: string;
  messages?: MessageType[];
  createdAt?: string;
};
