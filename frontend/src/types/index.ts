export interface User {
  id: string;
  email: string;
  name: string;
  grade?: string;
  school?: string;
  board?: string;
  studyGoals?: string;
  preferredHours?: number;
  preferredTime?: string;
  createdAt: string;
  profile?: Profile;
  preferences?: UserPreferences;
}

export interface Profile {
  id: string;
  userId: string;
  avatar?: string;
  bio?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailReminders: boolean;
  studyReminders: boolean;
  breakReminders: boolean;
  pomodoroWork: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  sessionsUntilLongBreak: number;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  teacher?: string;
  totalChapters: number;
  completedChapters: number;
  studyHours: number;
  examDate?: string;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
  _count?: {
    chapters: number;
    tasks: number;
    exams: number;
    notes: number;
  };
  progress?: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  userId: string;
  name: string;
  status: 'NOT_STARTED' | 'LEARNING' | 'PRACTICING' | 'COMPLETED';
  progress: number;
  lastStudiedAt?: string;
  studyTime: number;
  revisionCount: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  subjectId?: string;
  subject?: Subject;
  title: string;
  description?: string;
  type: 'HOMEWORK' | 'ASSIGNMENT' | 'PROJECT' | 'REVISION' | 'EXAM_PREPARATION' | 'PERSONAL' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  startTime?: string;
  duration?: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  userId: string;
  subjectId: string;
  subject: Subject;
  name: string;
  date: string;
  preparationPct: number;
  syllabus?: string;
  createdAt: string;
  updatedAt: string;
  daysLeft?: number;
  chapters?: Chapter[];
}

export interface Note {
  id: string;
  userId: string;
  subjectId?: string;
  subject?: Subject;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  subject?: Subject;
  chapterId?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  type: 'FOCUS' | 'POMODORO' | 'STUDY' | 'REVISION' | 'PRACTICE';
  notes?: string;
  createdAt: string;
}

export interface StudyPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  examDate?: string;
  generatedBy?: string;
  planData: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  blocks?: StudyBlock[];
}

export interface StudyBlock {
  id: string;
  planId: string;
  userId: string;
  subjectId?: string;
  subject?: Subject;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  duration: number;
  type: 'STUDY' | 'REVISION' | 'PRACTICE' | 'BREAK' | 'EXAM_PREP' | 'ASSIGNMENT';
  completed: boolean;
  completedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  weeklyActivity: boolean[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'EXAM_UPCOMING' | 'TASK_DEADLINE' | 'STUDY_REMINDER' | 'BREAK_REMINDER' | 'SESSION_SCHEDULED' | 'STREAK_MILESTONE';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  mode: 'EXPLAIN' | 'QUIZ' | 'FLASHCARDS' | 'SUMMARY' | 'STUDY_PLAN' | 'PRACTICE';
  createdAt: string;
  updatedAt: string;
  messages?: AiMessage[];
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  type: 'exam' | 'task' | 'study-block' | 'session';
  title: string;
  subject?: string;
  subjectColor?: string;
  date: string;
  startTime?: string;
  duration?: number;
  priority?: string;
  completed?: boolean;
  sessionType?: string;
}

export interface AnalyticsData {
  totalStudyHours: number;
  weeklyHours: { week: string; hours: number }[];
  subjectDistribution: { name: string; hours: number; color: string }[];
  completionTrend: { date: string; completed: number; total: number; rate: number }[];
  consistency: { date: string; studied: boolean }[];
  tasksCompleted: number;
  totalTasks: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  avgSessionLength: number;
  mostStudiedSubject: string;
  leastStudiedSubject: string;
  sessionsCount: number;
}

export interface DashboardData {
  todayProgress: {
    plannedMinutes: number;
    completedMinutes: number;
    tasksCompleted: number;
    totalTasks: number;
    currentStreak: number;
  };
  todaysPlan: StudyBlock[];
  upcoming: CalendarEvent[];
  subjectHealth: Subject[];
  insights: string[];
}