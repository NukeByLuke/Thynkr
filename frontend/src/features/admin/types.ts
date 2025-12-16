/**
 * Admin Feature Types
 * Shared type definitions for the admin dashboard
 */

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt?: string;
  subscription: {
    status: string;
    plan: string;
  } | null;
}

// Stats Types
export interface Stats {
  users: {
    total: number;
    basic: number;
    standard: number;
    premium: number;
  };
  content: {
    total: number;
  };
  subscriptions: {
    active: number;
  };
}

// Tab Types
export type TabType = 'users' | 'courses' | 'payments' | 'logs' | 'system';

// Filter Types
export type RoleFilter = '' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ADMIN';
export type VerificationFilter = '' | 'verified' | 'unverified';
export type SubscriptionFilter = '' | 'none' | 'basic' | 'standard' | 'premium';
