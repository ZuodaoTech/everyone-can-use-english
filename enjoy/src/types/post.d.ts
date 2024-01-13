type PostType = {
  id: string;
  metadata: {
    type: 'text' | 'prompt' | 'llm_configuration';
    content:
      | string
      | {
          [key: string]: any;
        };
  };
  user: UserType;
  targetType?: string;
  targetId?: string;
  target?: MediumType | StoryType | RecordingType;
  createdAt: Date;
  updatedAt: Date;
};
