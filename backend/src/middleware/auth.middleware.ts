/**
 * Authentication Middleware
 * JWT token verification and role-based access control for protected routes.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Authenticate incoming requests via JWT token (header or query parameter)
 * Attaches decoded user information to request.user
 */
export async function authenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check query params as fallback (needed for EventSource which can't set headers)
    if (!token && request.query && typeof request.query === 'object') {
      const queryToken = (request.query as any).token;
      if (queryToken) {
        token = queryToken;
      }
    }

    if (!token) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const decoded = verifyAccessToken(token);

    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}

/**
 * Require specific role(s) for route access
 * @param allowedRoles - Array of role names permitted to access the route
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
}

const roleHierarchy: { [key: string]: number } = {
  BASIC: 1,
  STANDARD: 2,
  PREMIUM: 3,
  ADMIN: 4,
};

// Legacy role mapping for backwards compatibility
const legacyRoleMap: { [key: string]: string } = {
  FREE: 'BASIC',
  PRO: 'STANDARD',
};

/**
 * Normalize legacy role names to current naming convention
 */
export function normalizeRole(role: string): string {
  return legacyRoleMap[role] || role;
}

/**
 * Require minimum role level based on hierarchy (BASIC < STANDARD < PREMIUM < ADMIN)
 * @param minRole - Minimum role required to access the route
 */
export function requireMinRole(minRole: string) {
  return async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const normalizedUserRole = normalizeRole(request.user.role);
    const normalizedMinRole = normalizeRole(minRole);

    const userRoleLevel = roleHierarchy[normalizedUserRole] || 0;
    const requiredRoleLevel = roleHierarchy[normalizedMinRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return reply.code(403).send({
        error: 'Insufficient permissions',
        required: normalizedMinRole,
        current: normalizedUserRole,
        upgradeRequired: true,
      });
    }
  };
}
