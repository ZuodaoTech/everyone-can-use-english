type NoteType = {
  id: string;
  targetId: string;
  targetType: string;
  content: string;
  parameters: any;
  syncedAt: Date;
  uploadedAt: Date;
  updatedAt: Date;
  createdAt: Date;
  segment?: SegmentType;
  isSynced?: boolean;
  sync(): Promise<void>;
};
