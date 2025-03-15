type ChapterType = {
  id: string;
  courseId: string;
  sequence: number;
  keywords: string[];
  title: string;
  content: string;
  course?: CourseType;
  finishesCount?: number;
  translations?: {
    language: string;
    content: string;
  }[];
  finished?: boolean;
  examples?: {
    id: string;
    keywords: string[];
    language: string;
    content: string;
    audioUrl?: string;
    translations?: {
      language: string;
      content: string;
    }[];
  }[];
  enrollment?: EnrollmentType;
};
