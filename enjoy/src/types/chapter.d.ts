type ChapterType = {
  id: string;
  sequence: number;
  keywords: string[];
  title: string;
  content: string;
  translations?: {
    language: string;
    translation: string;
  }[];
  examples?: {
    keywords: string[];
    language: string;
    content: string;
    audioUrl?: string;
  }[];
};
