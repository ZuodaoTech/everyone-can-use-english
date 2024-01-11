type PostType = {
  id: string;
  content?: string;
  user: UserType;
  targetType: string;
  target?: MediumType;
  createdAt: string;
  updatedAt: string;
}
