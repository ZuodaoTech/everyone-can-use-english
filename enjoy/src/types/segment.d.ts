type SegmentType = {
  id: string;
  targetId: string;
  targetType: string;
  audio?: AudioType;
  video?: VideoType;
  segmentIndex: number;
  md5: string;
  caption: TimeLIne;
  startTime: number;
  endTime: number;
  syncedAt?: Date;
  uploadedAt?: Date
  updatedAt: Date
  createdAt: Date
};