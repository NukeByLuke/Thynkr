/**
 * Thynkr Application Constants
 * 
 * Centralized configuration values used across the application.
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Application Info
export const APP_NAME = 'Thynkr';
export const APP_DESCRIPTION = 'AI-powered study companion';
export const APP_VERSION = '1.0.0';

// Feature Limits by Role
export const ROLE_LIMITS = {
  BASIC: {
    maxUploads: 5,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    aiGenerationsPerDay: 3,
    tutorMessagesPerDay: 10,
  },
  STANDARD: {
    maxUploads: 50,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    aiGenerationsPerDay: 25,
    tutorMessagesPerDay: 100,
  },
  PREMIUM: {
    maxUploads: -1, // Unlimited
    maxFileSize: 100 * 1024 * 1024, // 100MB
    aiGenerationsPerDay: -1,
    tutorMessagesPerDay: -1,
  },
  ADMIN: {
    maxUploads: -1,
    maxFileSize: 100 * 1024 * 1024,
    aiGenerationsPerDay: -1,
    tutorMessagesPerDay: -1,
  },
} as const;

// File Upload Configuration
export const ALLOWED_FILE_TYPES = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  presentation: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
} as const;

export const MAX_FILE_NAME_LENGTH = 255;

// Pagination Defaults
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// TTS Configuration
export const TTS_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'echo', name: 'Echo', description: 'Warm and conversational' },
  { id: 'fable', name: 'Fable', description: 'Expressive and dynamic' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'nova', name: 'Nova', description: 'Friendly and upbeat' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear and pleasant' },
] as const;

export const TTS_SPEED_RANGE = { min: 0.25, max: 4.0, default: 1.0 };

// Quiz Configuration
export const QUIZ_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export const DEFAULT_QUIZ_QUESTIONS = 10;

// Course Categories
export const COURSE_CATEGORIES = [
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LANGUAGES', label: 'Languages' },
  { value: 'HUMANITIES', label: 'Humanities' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ARTS', label: 'Arts' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'LAW', label: 'Law' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
] as const;

// Route Paths
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  PRICING: '/pricing',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  MY_COURSES: '/my-courses',
  LIBRARY: '/library',
  FILES: '/files',
  TUTOR: '/tutor',
  STUDY: '/study',
  PROGRESS: '/progress',
  SAVED_PACKS: '/saved-packs',
  
  // Account
  SETTINGS: '/settings',
  ACCOUNT: '/account',
  TRANSACTIONS: '/transactions',
  
  // Admin
  ADMIN: '/admin',
} as const;
