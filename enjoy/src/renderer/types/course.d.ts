type CourseType = {
  id: string;
  title: string;
  description: string;
  chaptersCount: number;
  enrollmentsCount: number;
  coverUrl?: string;
  chapters?: ChapterType[];
  enrolled?: boolean;
  enrollment?: EnrollmentType;
};
