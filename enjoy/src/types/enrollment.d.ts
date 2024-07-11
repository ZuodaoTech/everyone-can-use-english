type EnrollmentType = {
  id: string;
  courseId: string;
  state: string;
  progress: number;
  currentChapterId?: string;
  currentChapterSequence?: number;
  course?: CourseType;
  createdAt: string;
  updatedAt: string;
};
