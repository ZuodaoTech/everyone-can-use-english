type NoteType = {
  id: string;
  targetId: string;
  targetType: string;
  content: string;
  syncedAt: Date;
  uploadedAt: Date;
  updatedAt: Date;
  createdAt: Date;
  segment?: SegmentType;
  isSynced?: boolean;
  sync(): Promise<void>;
};
