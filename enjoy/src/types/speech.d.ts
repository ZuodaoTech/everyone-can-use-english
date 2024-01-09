type SpeechType = {
  id: string;
  sourceId: string;
  sourceType: string;
  source?: MessageType;
  text: string;
  engine: string;
  model: string;
  voice: string;
  md5: string;
  filename: string;
  filePath: string;
  src?: string;
  createdAt: Date;
  updatedAt: Date;
};
