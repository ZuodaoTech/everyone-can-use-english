type AudioType = {
  mediaType: string,
  id: string;
  source: string;
  name: string;
  filename: string;
  language?: string;
  description?: string;
  src?: string;
  coverUrl?: string;
  md5: string;
  metadata?: Ffmpeg.FfprobeData;
  duration?: number;
  transcribed?: boolean;
  transcribing?: boolean;
  recordingsCount?: number;
  recordingsDuration?: number;
  isUploaded?: boolean;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
