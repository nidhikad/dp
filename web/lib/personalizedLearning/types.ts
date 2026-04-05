export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  concept: string;
  explanation: string;
  tags: string[];
  domain: string;
};

export type TopicMeta = {
  id: string;
  title: string;
  summary: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  tags: string[];
  studyPoints: string[];
  geeksForGeeks: { label: string; href: string }[];
  youtube: { label: string; href: string }[];
};

export type LearningDomain = {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  accent: string;
  description: string;
  topics: TopicMeta[];
};
