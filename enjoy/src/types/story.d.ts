type StoryType = {
  id: string;
  url: string;
  title: string;
  content: string;
  metadata: {
    [key: string]: string;
  };
  extraction?: {
    words?: string[];
    idioms?: string[];
  };
  vocabulary?: string[];
  extracted?: boolean;
  starred?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CreateStoryParamsType = {
  title: string;
  content: string;
  url: string;
  html: string;
  metadata: {
    [key: string]: string;
  };
  extraction?: {
    words?: string[];
    idioms?: string[];
  }
};
