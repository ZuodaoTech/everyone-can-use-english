type VideoType = {
  mediaType: string,
  id: string;
  source: string;
  name: string;
  filename: string;
  description?: string;
  filename?: string;
  coverUrl?: string;
  md5: string;
  src?: string;
  metadata?: Ffmpeg.FfprobeData;
  duration?: number;
  transcribed: boolean;
  transcribing: boolean;
  recordingsCount?: number;
  recordingsDuration?: number;
  isUploaded?: boolean;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
