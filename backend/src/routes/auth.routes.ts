import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';
import prisma from '../db/client';
import path from 'path';
import fs from 'fs/promises';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES } from '../constants/language.constants';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from '../schemas/validation.schemas';

const authService = new AuthService();

export default async function authRoutes(server: FastifyInstance) {
  // Register
  server.post('/register', {
    handler: async (request, reply) => {
      try {
        const validated = registerSchema.parse(request.body);
        const user = await authService.register(validated);
        return reply.code(201).send({
          message: 'Registration successful',
          user,
        });
      } catch (error: any) {
        server.log.error({ error, body: request.body }, 'Registration error');
        
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
          return reply.code(400).send({ 
            error: 'Validation failed', 
            details: error.errors 
          });
        }
        
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  // Login
  server.post('/login', {
    handler: async (request, reply) => {
      try {
        const validated = loginSchema.parse(request.body);
        const result = await authService.login(validated);
        return reply.send(result);
      } catch (error: any) {
        return reply.code(401).send({ error: error.message });
      }
    },
  });

  // Refresh token
  server.post('/refresh', {
    handler: async (request, reply) => {
      try {
        const { refreshToken } = refreshTokenSchema.parse(request.body);
        const result = await authService.refreshAccessToken(refreshToken);
        return reply.send(result);
      } catch (error: any) {
        return reply.code(401).send({ error: error.message });
      }
    },
  });

  // Logout
  server.post('/logout', {
    handler: async (request, reply) => {
      try {
        const { refreshToken } = refreshTokenSchema.parse(request.body);
        await authService.logout(refreshToken);
        return reply.send({ message: 'Logout successful' });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  // Request password reset
  server.post('/password-reset/request', {
    handler: async (request, reply) => {
      const validated = passwordResetRequestSchema.parse(request.body);
      const result = await authService.requestPasswordReset(validated);
      return reply.send(result);
    },
  });

  // Reset password
  server.post('/password-reset/confirm', {
    handler: async (request, reply) => {
      try {
        const validated = passwordResetSchema.parse(request.body);
        const result = await authService.resetPassword(validated);
        return reply.send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  // Verify email
  server.get('/verify-email/:token', {
    handler: async (request, reply) => {
      try {
        const { token } = request.params as { token: string };
        const result = await authService.verifyEmail(token);
        return reply.send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  // Update profile (protected)
  server.patch('/profile', {
    preHandler: authenticate,
    handler: async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.user!.userId;
        const { username, avatarUrl, theme, preferredLanguage } = request.body as any;

        let normalizedLanguage: string | undefined;
        if (preferredLanguage !== undefined) {
          const candidate = String(preferredLanguage).trim().toLowerCase();
          if (candidate && !SUPPORTED_LANGUAGE_CODES.has(candidate)) {
            return reply.code(400).send({ error: 'Unsupported language selection' });
          }
          normalizedLanguage = candidate || DEFAULT_LANGUAGE;
        }

        const updateData: Record<string, unknown> = {
          ...(username !== undefined && { username }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(theme !== undefined && { theme }),
          ...(normalizedLanguage !== undefined && { preferredLanguage: normalizedLanguage }),
        };

        if (Object.keys(updateData).length === 0) {
          const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              theme: true,
              role: true,
              emailVerified: true,
              createdAt: true,
              preferredLanguage: true,
            },
          });
          return reply.send(existing);
        }

        const updated = await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            theme: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            preferredLanguage: true,
          },
        });

        return reply.send(updated);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(400).send({ error: 'Username already taken' });
        }
        return reply.code(500).send({ error: 'Failed to update profile' });
      }
    },
  });

  // Change password (protected)
  server.post('/change-password', {
    preHandler: authenticate,
    handler: async (request: AuthenticatedRequest, reply) => {
      try {
  const userId = request.user!.userId;
        const { currentPassword, newPassword } = request.body as any;

        if (!currentPassword || !newPassword) {
          return reply.code(400).send({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 8) {
          return reply.code(400).send({ error: 'Password must be at least 8 characters' });
        }

        const result = await authService.changePassword(userId, currentPassword, newPassword);
        return reply.send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  // Upload avatar (protected)
  server.post('/upload-avatar', {
    preHandler: authenticate,
    handler: async (request: AuthenticatedRequest, reply) => {
      try {
  const userId = request.user!.userId;
        
        // Handle multipart form data with multer
        const file: Express.Multer.File | undefined = await new Promise((resolve, reject) => {
          const multerMiddleware = upload.single('avatar');
          multerMiddleware(request.raw as any, reply.raw as any, (err: any) => {
            if (err) {
              server.log.error({ error: err }, 'Multer error');
              return reject(err);
            }
            resolve((request.raw as any).file);
          });
        });

        if (!file) {
          server.log.warn('No file received in upload request');
          return reply.code(400).send({ error: 'No file uploaded' });
        }
        
        server.log.info({ filename: file.filename, mimetype: file.mimetype, size: file.size }, 'File received');

        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
          // Clean up uploaded file
          await fs.unlink(file.path).catch(() => {});
          return reply.code(400).send({ error: 'File must be an image' });
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          await fs.unlink(file.path).catch(() => {});
          return reply.code(400).send({ error: 'Image must be less than 2MB' });
        }

        // Get current user to check for existing avatar
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true },
        });

        // Delete old avatar file if it exists
        if (currentUser?.avatarUrl) {
          const oldFilePath = path.join(process.cwd(), 'uploads', path.basename(currentUser.avatarUrl));
          await fs.unlink(oldFilePath).catch(() => {
            server.log.info('Old avatar file not found or already deleted');
          });
        }

        // File is already saved by multer, just get the path
        const avatarUrl = `/uploads/${path.basename(file.path)}`;

        // Update user avatar URL
        await prisma.user.update({
          where: { id: userId },
          data: { avatarUrl },
        });

        return reply.send({ avatarUrl });
      } catch (error: any) {
        server.log.error({ error }, 'Avatar upload error');
        return reply.code(500).send({ error: 'Failed to upload avatar' });
      }
    },
  });

  // Delete account (protected)
  server.delete('/account', {
    preHandler: authenticate,
    handler: async (request: AuthenticatedRequest, reply) => {
      try {
  const userId = request.user!.userId;

        // Get user's avatar to delete file
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true },
        });

        // Delete avatar file if exists
        if (user?.avatarUrl) {
          const avatarPath = path.join(process.cwd(), 'uploads', path.basename(user.avatarUrl));
          await fs.unlink(avatarPath).catch(() => {
            server.log.info('Avatar file not found or already deleted');
          });
        }

        // Delete all user data (cascading deletes handled by Prisma)
        await prisma.user.delete({
          where: { id: userId },
        });

        return reply.send({ message: 'Account deleted successfully' });
      } catch (error: any) {
        server.log.error({ error }, 'Account deletion error');
        return reply.code(500).send({ error: 'Failed to delete account' });
      }
    },
  });
}
