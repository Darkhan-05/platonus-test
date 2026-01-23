export type Role = 'admin' | 'user';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  favorites: string[];
};

export type Question = {
  id: string;
  text: string;
  variants: string[];
  correctVariantIndex: number;
};

export type Quiz = {
  id: string;
  title: string;
  questions: Question[];
  createdBy: string;
  createdAt: string;
  timesSolved: number;
};

export type Attempt = {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, number>;
  date: string;
};
