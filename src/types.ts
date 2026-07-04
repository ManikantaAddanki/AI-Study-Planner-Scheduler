export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  streak: number;
  xp: number;
  level: number;
  badges: string[];
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Priority = 'High' | 'Medium' | 'Low';

export interface Subject {
  id: string;
  userId: string;
  name: string;
  difficulty: Difficulty;
  priority: Priority;
  examDate: string; // YYYY-MM-DD
  weakTopics: string[];
  preferredStudyDuration: number; // in minutes
  color: string; // hex or Tailwind color name
}

export interface Task {
  id: string;
  userId: string;
  subjectId?: string; // Optional links to subject
  title: string;
  deadline: string; // YYYY-MM-DD
  completed: boolean;
  priority: Priority;
}

export interface ScheduleItem {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  subject: string;
  isBreak: boolean;
  isRevision: boolean;
  topic?: string;
}

export interface RevisionSession {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  revisionDate: string; // YYYY-MM-DD
  completed: boolean;
  stage: number; // 1, 3, 7, 14, 30 days
}

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  content: string; // rich text or markdown
  updatedAt: string;
}

export interface Bookmark {
  timestamp: string; // e.g. "12:34"
  title: string;
}

export interface ClassRecording {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  recordingUrl: string; // URL link or YouTube link
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  notes: string; // User notes
  transcript?: string; // paste transcript for AI Summarizer & Quiz
  bookmarks: Bookmark[];
  aiSummary?: string; // Gemini generated summary
  aiQuiz?: {
    question: string;
    answerKey: string;
  }[];
  quizAnswers?: string[];
  quizGradeFeedback?: string;
  xpAwarded?: boolean;
}

export interface UserStats {
  studyHours: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number; // %
  subjectHours: Record<string, number>;
  weeklyHours: { day: string; hours: number }[]; // [ { day: 'Mon', hours: 2 }, ... ]
  weakAreaProgress: { topic: string; confidence: number }[]; // [ { topic: 'OOP', confidence: 40 } ]
}

// Mock Interview types
export interface InterviewMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

export interface MockInterviewSession {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  messages: InterviewMessage[];
  status: 'active' | 'completed';
  feedback?: string;
  score?: number;
  date: string;
}

// MCQ Quiz types
export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface MockQuizSession {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  questions: MCQQuestion[];
  userAnswers?: number[]; // indices of chosen answers
  score?: number; // percentage e.g. 80
  status: 'active' | 'completed';
  date: string;
}

// Weekly Assessment types
export interface WeeklyAssessment {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  weekNumber: number;
  title: string;
  description: string;
  questions: string[]; // Open-ended analytical questions
  studentAnswers?: string[];
  gradeFeedback?: string;
  score?: number; // e.g. 90
  status: 'pending' | 'submitted';
  date: string;
}

// Problem Solving types
export interface ProblemChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  topic: string;
  templateCode: string;
  subjectId?: string;
  subjectName?: string;
  points?: number;
  acceptanceRate?: string;
}

export interface UserProblemSolution {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  subjectId: string;
  subjectName: string;
  solutionCode: string;
  status: 'solved' | 'failed' | 'unsolved';
  aiReview?: string;
  score?: number; // e.g. 85
  date: string;
}

export interface CourseFeedback {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  rating: number; // 1-5
  generalFeedback: string;
  enjoyedMost: string;
  strugglingWith: string;
  date: string; // YYYY-MM-DD
}

