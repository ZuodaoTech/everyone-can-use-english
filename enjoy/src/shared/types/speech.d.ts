type SpeechType = {
  id: string;
  sourceId: string;
  sourceType: string;
  source?: MessageType;
  text: string;
  section: number;
  segment: number;
  engine: string;
  model: string;
  voice: string;
  md5: string;
  filename: string;
  filePath: string;
  configuration: { [key: string]: any };
  src?: string;
  createdAt: Date;
  updatedAt: Date;
};
