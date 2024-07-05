type ChapterType = {
  id: string;
  sequence: number;
  keywords: string[];
  title: string;
  content: string;
  course?: CourseType;
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
