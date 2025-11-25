export type Role = 'FREE' | 'PRO' | 'PREMIUM' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  theme?: 'light' | 'dark';
  role: Role;
  emailVerified: boolean;
  preferredLanguage?: string;
  createdAt: string;
  subscription?: {
    status: string;
    stripePriceId: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Content {
  id: string;
  title: string;
  description?: string;
  content?: string;
  slug: string;
  requiredRole: Role;
  featured: boolean;
  thumbnail?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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
