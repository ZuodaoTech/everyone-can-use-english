type NoteType = {
  id: string;
  targetId: string;
  targetType: string;
  content: string;
  syncedAt: Date;
  uploadedAt: Date;
  segment?: SegmentType;
  isSynced?: boolean;
  sync(): Promise<void>;
};
