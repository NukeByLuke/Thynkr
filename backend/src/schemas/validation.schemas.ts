import { z } from 'zod';
import { SUPPORTED_LANGUAGE_CODES, DEFAULT_LANGUAGE } from '../constants/language.constants';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  preferredLanguage: z
    .string()
    .min(2)
    .max(10)
    .transform((value) => value.trim().toLowerCase() || DEFAULT_LANGUAGE)
    .refine((value) => SUPPORTED_LANGUAGE_CODES.has(value), {
      message: 'Unsupported language selection',
    })
    .optional(),
  quizCorrectSound: z
    .enum([
      'wave',
      'classicding',
      'spark',
      'chime',
      'arcade',
      'ding',
      'pop',
      'off',
    ])
    .optional(),
});

export const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  slug: z.string().min(1, 'Slug is required'),
  requiredRole: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'ADMIN']).default('BASIC'),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  thumbnail: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateContentSchema = createContentSchema.partial();

export const checkoutSessionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Invalid success URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  slug: z
    .string()
    .min(1, 'Slug must be at least 1 character')
    .max(80, 'Slug must be less than 80 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
    .optional(),
  bannerImage: z.string().max(500, 'Banner image path is too long').optional(),
  coverImage: z.string().max(500, 'Cover image path is too long').optional(),
});

export const updateCourseSchema = createCourseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const addCourseLessonSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  title: z.string().min(1, 'Lesson title is required'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  order: z.number().int().min(0, 'Order must be a positive integer').optional(),
});

export const updateCourseLessonSchema = z
  .object({
    title: z.string().min(1, 'Lesson title is required').optional(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const reorderCourseLessonsSchema = z.object({
  lessons: z
    .array(
      z.object({
        id: z.string().min(1, 'Lesson ID is required'),
        order: z.number().int().min(0, 'Order must be a positive integer'),
      })
    )
    .min(1, 'At least one lesson is required'),
});

export const publishCourseSchema = z.object({
  published: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type AddCourseLessonInput = z.infer<typeof addCourseLessonSchema>;
export type UpdateCourseLessonInput = z.infer<typeof updateCourseLessonSchema>;
export type ReorderCourseLessonsInput = z.infer<typeof reorderCourseLessonsSchema>;
export type PublishCourseInput = z.infer<typeof publishCourseSchema>;
