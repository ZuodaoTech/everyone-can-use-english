type PostType = {
  id: string;
  metadata: {
    type: "text" | "prompt" | "gpt" | "note";
    content:
      | string
      | {
          [key: string]: any;
        };
  };
  user: UserType;
  targetType?: string;
  targetId?: string;
  target?: MediumType | StoryType | RecordingType | NoteType;
  liked?: boolean;
  likesCount?: number;
  likeByUsers?: UserType[];
  createdAt: Date;
  updatedAt: Date;
};
