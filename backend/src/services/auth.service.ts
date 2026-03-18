/**
 * Authentication Service
 * Handles user registration, login, token management, and password reset operations.
 */

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import prisma from '../db/client';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';
import {
  RegisterInput,
  LoginInput,
  PasswordResetRequestInput,
  PasswordResetInput,
} from '../schemas/validation.schemas';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';

/**
 * AuthService - Manages authentication and user account operations
 */
export class AuthService {
  /**
   * Register a new user account
   * @param data - User registration data (email, password, username, name)
   * @returns Newly created user object (excluding password)
   */
  async register(data: RegisterInput) {
    // Generate username from email if not provided
    let username = data.username;
    if (!username) {
      const base = data.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      username = base;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${base}${counter}`;
        counter++;
      }
    }

    // Check if email or username already exists
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: data.email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingEmail && existingUsername) {
      throw new Error('Username or email already in use');
    }

    if (existingEmail) {
      throw new Error('Email already in use');
    }

    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        username,
        firstName: data.firstName,
        lastName: data.lastName,
        emailVerifyToken: randomBytes(32).toString('hex'),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        preferredLanguage: true,
      },
    });

    // Send verification email
    try {
      const token = await prisma.user.findUnique({
        where: { id: user.id },
        select: { emailVerifyToken: true },
      });
      if (token?.emailVerifyToken) {
        await sendVerificationEmail(user.email, token.emailVerifyToken);
      }
    } catch (error) {
      // Log but don't fail registration if email fails
      console.error('Failed to send verification email:', error);
    }

    return user;
  }

  /**
   * Authenticate user and generate JWT tokens
   * @param data - Login credentials (email, password)
   * @returns Access token, refresh token, and user data
   */
  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user has a password (might be OAuth-only account)
    if (!user.password) {
      throw new Error('Please sign in with Google or your OAuth provider');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        preferredLanguage: user.preferredLanguage,
        quizCorrectSound: user.quizCorrectSound,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    // Find refresh token in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        }
      },
    });

    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token
    const payload = {
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    };

    const accessToken = generateAccessToken(payload);

    return { accessToken };
  }

  async logout(refreshToken: string) {
    // Revoke refresh token
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }

  async requestPasswordReset(data: PasswordResetRequestInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      // Log but don't reveal if email failed
      console.error('Failed to send password reset email:', error);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(data: PasswordResetInput) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: data.token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has a password (might be OAuth-only account)
    if (!user.password) {
      throw new Error('Cannot change password for OAuth-only accounts');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}
