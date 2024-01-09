type VideoType = {
  id: string;
  source: string;
  name: string;
  description?: string;
  filename?: string;
  coverUrl?: string;
  md5: string;
  src?: string;
  metadata?: Ffmpeg.FfprobeData;
  transcribed: boolean;
  transcribing: boolean;
  recordingsCount?: number;
  recordingsDuration?: number;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
