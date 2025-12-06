/**
 * Protected Route Component
 * Route wrapper with authentication and role-based access control.
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Role } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role;
  redirectTo?: string;
  showUpgradePrompt?: boolean;
}

/**
 * Role hierarchy mapping for access control (BASIC < STANDARD < PREMIUM < ADMIN)
 */
const roleHierarchy: { [key in Role]: number } = {
  BASIC: 1,
  STANDARD: 2,
  PREMIUM: 3,
  ADMIN: 4,
};

// Helper to check if user has minimum required role
export function hasMinRole(userRole: Role | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Helper to check if user can access course features
export function canAccessCourses(userRole: Role | undefined): boolean {
  return hasMinRole(userRole, 'STANDARD');
}

// Helper to check if user can browse public courses
export function canBrowsePublicCourses(userRole: Role | undefined): boolean {
  return hasMinRole(userRole, 'PREMIUM');
}

// Helper to check if user can create public courses
export function canCreatePublicCourses(userRole: Role | undefined): boolean {
  return hasMinRole(userRole, 'PREMIUM');
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo,
  showUpgradePrompt = true,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    // Save the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role if specified
  if (requiredRole && user) {
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      // Redirect to custom location or pricing page
      const destination = redirectTo || (showUpgradePrompt ? '/pricing' : '/');
      return <Navigate to={destination} replace />;
    }
  }

  return <>{children}</>;
}
