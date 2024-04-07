type RecordingType = {
  id: string;
  filename?: string;
  target?: AudioType | (MessageType & any);
  targetId: string;
  targetType: string;
  pronunciationAssessment?: PronunciationAssessmentType & any;
  referenceId: number;
  referenceText?: string;
  duration?: number;
  src?: string;
  md5: string;
  isSynced?: boolean;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type SegementRecordingStatsType = {
  targetId: string;
  targetType: string;
  referenceId: number;
  referenceText?: string;
  count: number;
  duration: number;
}[];
