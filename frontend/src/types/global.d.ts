/**
 * Thynkr Global Type Definitions
 * 
 * Shared interfaces and types used throughout the application.
 * These types should be kept in sync with backend Prisma models.
 */

// ============================================================
// Enums & Constants
// ============================================================

export type Role = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ADMIN';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
export type FileStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type CourseVisibility = 'PRIVATE' | 'PUBLIC';
export type CourseCategory = 
  | 'MATHEMATICS' 
  | 'SCIENCE' 
  | 'TECHNOLOGY' 
  | 'ENGINEERING' 
  | 'LANGUAGES' 
  | 'HUMANITIES' 
  | 'BUSINESS' 
  | 'ARTS' 
  | 'HEALTH' 
  | 'LAW' 
  | 'OTHER';
export type FileAccessType = 'INTERNAL' | 'DOWNLOADABLE';
export type StudyActivityType = 
  | 'FILE_UPLOAD' 
  | 'SUMMARY_VIEW' 
  | 'NOTES_VIEW' 
  | 'QUIZ_ATTEMPT' 
  | 'FLASHCARD_STUDY' 
  | 'TUTOR_CHAT' 
  | 'TTS_GENERATE' 
  | 'STUDY_PACK_CREATE';

// ============================================================
// User & Auth Types
// ============================================================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  theme?: 'light' | 'dark';
  preferredLanguage?: string;
  ttsVoice?: string;
  ttsSpeed?: number;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  stripePriceId: string;
  planType: Role;
  billingCycle: BillingCycle;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ============================================================
// Course Types
// ============================================================

export interface Course {
  id: string;
  title: string;
  description?: string;
  slug: string;
  bannerImage?: string;
  coverImage?: string;
  category: CourseCategory;
  visibility: CourseVisibility;
  published: boolean;
  shareToken?: string;
  createdBy: string;
  creator?: User;
  files?: CourseFile[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseFile {
  id: string;
  courseId: string;
  name: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  order: number;
  accessType: FileAccessType;
  aiContent?: CourseFileAI;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFileAI {
  id: string;
  fileId: string;
  extractedText?: string;
  summary?: AIContent;
  notes?: AINotesContent;
  quiz?: AIQuizContent;
  cards?: AICardsContent;
  summaryGeneratedAt?: string;
  notesGeneratedAt?: string;
  quizGeneratedAt?: string;
  cardsGeneratedAt?: string;
}

// ============================================================
// AI Content Types
// ============================================================

export interface AIContent {
  content: string;
  sections?: Array<{
    title: string;
    content: string;
  }>;
}

export interface AINotesContent {
  keyPoints: string[];
  detailed: string;
}

export interface AIQuizContent {
  title: string;
  questions: QuizQuestion[];
  difficulty?: QuizDifficulty;
}

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  order?: number;
}

export interface AICardsContent {
  title: string;
  cards: Flashcard[];
}

export interface Flashcard {
  id?: string;
  front: string;
  back: string;
  order?: number;
}

// ============================================================
// Study Types
// ============================================================

export interface StudyPack {
  id: string;
  ownerId: string;
  courseId?: string;
  fileIds: string[];
  fileHash: string;
  title: string;
  pages?: StudyPage[];
  quiz?: AIQuizContent;
  cards?: AICardsContent;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPage {
  pageNumber: number;
  heading: string;
  content: string;
}

export interface StudySession {
  id: string;
  userId: string;
  activityType: StudyActivityType;
  fileId?: string;
  durationMinutes: number;
  createdAt: string;
}

export interface StudyStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  totalStudyDays: number;
  totalMinutes: number;
}

// ============================================================
// Tutor Types
// ============================================================

export interface TutorSession {
  id: string;
  userId: string;
  title: string;
  messages?: TutorMessage[];
  files?: TutorSessionFile[];
  createdAt: string;
  updatedAt: string;
}

export interface TutorMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface TutorSessionFile {
  id: string;
  sessionId: string;
  fileId: string;
  file?: UploadedFile;
}

// ============================================================
// File Types (User Uploads)
// ============================================================

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  children?: Folder[];
  files?: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  id: string;
  userId: string;
  folderId?: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  status: FileStatus;
  extractedText?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Content Types
// ============================================================

export interface Content {
  id: string;
  title: string;
  description?: string;
  content?: string;
  slug: string;
  requiredRole: Role;
  featured: boolean;
  published: boolean;
  thumbnail?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================
// Utility Types
// ============================================================

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
