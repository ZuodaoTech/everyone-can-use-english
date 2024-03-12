type TranscriptionType = {
  id: string;
  targetId: string;
  targetType: string;
  state: "pending" | "processing" | "finished";
  engine: string;
  model: string;
  result: AlignmentResult;
};

type TranscriptionResultSegmentType = {
  offsets: {
    from: number;
    to: number;
  };
  text: string;
  timestamps: {
    from: string;
    to: string;
  };
};

type TranscriptionResultSegmentGroupType = TranscriptionResultSegmentType & {
  segments: TranscriptionResultSegmentType[];
};
