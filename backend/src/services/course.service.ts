import prisma from '../db/client';
import { randomBytes } from 'crypto';
import { logger } from '../lib/logger';
import fs from 'fs/promises';
import path from 'path';

const db = prisma as any;

// Types
export interface CreateCourseInput {
  title: string;
  description?: string;
  category: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  userId: string;
  userRole: string;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string | null;
  category?: string;
  visibility?: 'PRIVATE' | 'PUBLIC';
  bannerImage?: string | null;
  coverImage?: string | null;
}

export interface FileUploadLimits {
  maxFiles: number;
  maxFileSize: number;
  allowedTypes: string[];
}

export interface CourseAccessCheck {
  isOwner: boolean;
  isPublic: boolean;
  hasValidToken: boolean;
  isPremiumOrAdmin: boolean;
  hasAccess: boolean;
}

// Tier-based file upload limits
const TIER_LIMITS: Record<string, FileUploadLimits> = {
  BASIC: { maxFiles: 0, maxFileSize: 0, allowedTypes: [] },
  STANDARD: {
    maxFiles: 20,
    maxFileSize: 25 * 1024 * 1024,
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'audio/mpeg',
    ],
  },
  PREMIUM: {
    maxFiles: 100,
    maxFileSize: 100 * 1024 * 1024,
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/zip',
    ],
  },
  ADMIN: { maxFiles: 1000, maxFileSize: 500 * 1024 * 1024, allowedTypes: ['*'] },
};

/**
 * Service class for course business logic
 */
export class CourseService {
  /**
   * Generate a unique slug from title
   */
  generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50) +
      '-' +
      randomBytes(4).toString('hex')
    );
  }

  /**
   * Generate a share token
   */
  generateShareToken(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Get file upload limits for a user tier
   */
  getTierLimits(role: string): FileUploadLimits {
    return TIER_LIMITS[role] || TIER_LIMITS.BASIC;
  }

  /**
   * Check if user has reached file limit for a course
   */
  async checkFileLimit(courseId: string, userRole: string): Promise<{ allowed: boolean; currentCount: number; limit: number; error?: string }> {
    const limits = this.getTierLimits(userRole);
    
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { files: true } } },
    });

    if (!course) {
      return { allowed: false, currentCount: 0, limit: limits.maxFiles, error: 'Course not found' };
    }

    const currentCount = course._count?.files || 0;
    
    if (currentCount >= limits.maxFiles) {
      return {
        allowed: false,
        currentCount,
        limit: limits.maxFiles,
        error: `File limit reached. Your plan allows ${limits.maxFiles} files per course.`,
      };
    }

    return { allowed: true, currentCount, limit: limits.maxFiles };
  }

  /**
   * Validate file upload against tier limits
   */
  validateFileUpload(file: Express.Multer.File, userRole: string): { valid: boolean; error?: string } {
    const limits = this.getTierLimits(userRole);

    // Check file size
    if (file.size > limits.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${Math.round(limits.maxFileSize / 1024 / 1024)}MB`,
      };
    }

    // Check file type
    const allowedTypes = limits.allowedTypes;
    if (allowedTypes[0] !== '*' && !allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check course access permissions
   */
  checkCourseAccess(
    course: any,
    userId: string,
    userRole: string,
    token?: string
  ): CourseAccessCheck {
    const isOwner = course.createdBy === userId;
    const isPublic = course.visibility === 'PUBLIC';
    const hasValidToken = token ? course.shareToken === token : false;
    const isPremiumOrAdmin = userRole === 'PREMIUM' || userRole === 'ADMIN';

    let hasAccess = false;

    if (userRole === 'STANDARD') {
      hasAccess = isOwner || hasValidToken;
    } else if (isPremiumOrAdmin) {
      hasAccess = isOwner || isPublic || hasValidToken;
    }

    return {
      isOwner,
      isPublic,
      hasValidToken,
      isPremiumOrAdmin,
      hasAccess,
    };
  }

  /**
   * Create a new course
   */
  async createCourse(input: CreateCourseInput): Promise<any> {
    // Standard users can only create private courses
    if (input.userRole === 'STANDARD' && input.visibility === 'PUBLIC') {
      throw { statusCode: 403, message: 'Upgrade to Premium to create public courses' };
    }

    const slug = this.generateSlug(input.title);
    const shareToken = this.generateShareToken();

    const course = await db.course.create({
      data: {
        title: input.title,
        description: input.description || null,
        category: input.category,
        slug,
        visibility: input.visibility,
        shareToken,
        createdBy: input.userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info({ courseId: course.id, userId: input.userId }, 'Course created');
    return course;
  }

  /**
   * Update a course
   */
  async updateCourse(
    courseId: string,
    input: UpdateCourseInput,
    userId: string,
    userRole: string
  ): Promise<any> {
    const course = await db.course.findUnique({ where: { id: courseId } });

    if (!course) {
      throw { statusCode: 404, message: 'Course not found' };
    }

    if (course.createdBy !== userId) {
      throw { statusCode: 403, message: 'You can only edit your own courses' };
    }

    // Standard users cannot make courses public
    if (userRole === 'STANDARD' && input.visibility === 'PUBLIC') {
      throw { statusCode: 403, message: 'Upgrade to Premium to make courses public' };
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;
    if (input.bannerImage !== undefined) updateData.bannerImage = input.bannerImage;
    if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;

    const updated = await db.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        files: {
          orderBy: { order: 'asc' },
        },
      },
    });

    logger.info({ courseId, userId }, 'Course updated');
    return updated;
  }

  /**
   * Delete a course and its files
   */
  async deleteCourse(courseId: string, userId: string): Promise<void> {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { files: true },
    });

    if (!course) {
      throw { statusCode: 404, message: 'Course not found' };
    }

    if (course.createdBy !== userId) {
      throw { statusCode: 403, message: 'You can only delete your own courses' };
    }

    // Delete associated files from disk
    for (const file of course.files || []) {
      try {
        const fullPath = path.join(process.cwd(), 'uploads', file.filePath || '');
        await fs.unlink(fullPath).catch(() => {});
      } catch {
        // Ignore file deletion errors
      }
    }

    // Cascade delete will handle database cleanup
    await db.course.delete({ where: { id: courseId } });

    logger.info({ courseId, userId }, 'Course deleted');
  }

  /**
   * Regenerate course share token
   */
  async regenerateShareToken(courseId: string, userId: string): Promise<string> {
    const course = await db.course.findUnique({ where: { id: courseId } });

    if (!course) {
      throw { statusCode: 404, message: 'Course not found' };
    }

    if (course.createdBy !== userId) {
      throw { statusCode: 403, message: 'You can only manage your own courses' };
    }

    const newToken = this.generateShareToken();

    const updated = await db.course.update({
      where: { id: courseId },
      data: { shareToken: newToken },
    });

    logger.info({ courseId, userId }, 'Share token regenerated');
    return updated.shareToken;
  }

  /**
   * Get next file order for a course
   */
  async getNextFileOrder(courseId: string): Promise<number> {
    const lastFile = await db.courseFile.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });
    return (lastFile?.order ?? -1) + 1;
  }

  /**
   * Upload banner image
   */
  async uploadBanner(
    courseId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<string> {
    const course = await db.course.findUnique({ where: { id: courseId } });

    if (!course) {
      throw { statusCode: 404, message: 'Course not found' };
    }

    if (course.createdBy !== userId) {
      throw { statusCode: 403, message: 'You can only manage your own courses' };
    }

    // Validate it's an image
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      // Delete uploaded file
      await fs.unlink(file.path).catch(() => {});
      throw { statusCode: 400, message: 'Only image files are allowed for banner' };
    }

    // Delete old banner if exists
    if (course.bannerImage) {
      try {
        const oldPath = course.bannerImage.replace('/uploads/', '');
        const fullPath = path.join(process.cwd(), 'uploads', oldPath);
        await fs.unlink(fullPath).catch(() => {});
      } catch {
        // Ignore errors
      }
    }

    // Move file to courses folder with proper name
    const ext = path.extname(file.originalname);
    const newFilename = `banner-${Date.now()}${ext}`;
    const coursesDir = path.join(process.cwd(), 'uploads', 'courses', courseId);
    await fs.mkdir(coursesDir, { recursive: true });
    const newPath = path.join(coursesDir, newFilename);

    await fs.rename(file.path, newPath);

    const bannerUrl = `/uploads/courses/${courseId}/${newFilename}`;

    await db.course.update({
      where: { id: courseId },
      data: { bannerImage: bannerUrl },
    });

    logger.info({ courseId, userId }, 'Banner uploaded');
    return bannerUrl;
  }

  async uploadFile(
    courseId: string,
    file: Express.Multer.File,
    userId: string,
    userRole: string,
    name?: string
  ) {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { files: true } } },
    });

    if (!course) {
      throw { statusCode: 404, message: 'Course not found' };
    }

    if (course.createdBy !== userId) {
      throw { statusCode: 403, message: 'You can only upload to your own courses' };
    }

    // Check and validate file against tier limits
    await this.checkFileLimit(courseId, userRole);
    await this.validateFileUpload(file, userRole);

    // Get name from parameter or use original name
    const fileName = name || file.originalname;

    // Get next order
    const nextOrder = await this.getNextFileOrder(courseId);

    // Move file to courses directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'courses');
    await fs.mkdir(uploadsDir, { recursive: true });
    const newFileName = `${courseId}-${Date.now()}-${file.filename}`;
    const newPath = path.join(uploadsDir, newFileName);
    await fs.rename(file.path, newPath);

    const courseFile = await db.courseFile.create({
      data: {
        courseId,
        name: fileName,
        originalName: file.originalname,
        fileName: newFileName,
        filePath: `courses/${newFileName}`,
        fileType: file.mimetype,
        fileSize: file.size,
        order: nextOrder,
      },
    });

    logger.info({ courseId, fileId: courseFile.id, userId }, 'File uploaded to course');
    return courseFile;
  }

  async updateFile(
    courseId: string,
    fileId: string,
    updates: { name?: string; order?: number },
    userId: string,
    _userRole: string
  ) {
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw { statusCode: 404, message: 'Course not found' };
    }
    if (course.createdBy !== userId) {
      throw { statusCode: 403, message: 'You can only edit your own courses' };
    }

    const file = await db.courseFile.findFirst({
      where: { id: fileId, courseId },
    });

    if (!file) {
      throw { statusCode: 404, message: 'File not found' };
    }

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.order !== undefined) updateData.order = updates.order;

    const updated = await db.courseFile.update({
      where: { id: fileId },
      data: updateData,
    });

    logger.info({ courseId, fileId, userId }, 'Course file updated');
    return updated;
  }

  async deleteFile(courseId: string, fileId: string, userId: string, _userRole: string) {
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw { statusCode: 404, message: 'Course not found' };
    }
    if (course.createdBy !== userId) {
      throw { statusCode: 403, message: 'You can only edit your own courses' };
    }

    const file = await db.courseFile.findFirst({
      where: { id: fileId, courseId },
    });

    if (!file) {
      throw { statusCode: 404, message: 'File not found' };
    }

    // Delete physical file
    const fullPath = path.join(process.cwd(), 'uploads', file.filePath || '');
    await fs.unlink(fullPath).catch(() => {});

    await db.courseFile.delete({ where: { id: fileId } });

    logger.info({ courseId, fileId, userId }, 'Course file deleted');
  }

  async reorderFiles(
    courseId: string,
    fileOrders: Array<{ id: string; order: number }>,
    userId: string,
    _userRole: string
  ) {
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw { statusCode: 404, message: 'Course not found' };
    }
    if (course.createdBy !== userId) {
      throw { statusCode: 403, message: 'You can only edit your own courses' };
    }

    // Verify all files belong to this course
    const fileIds = fileOrders.map((f) => f.id);
    const files = await db.courseFile.findMany({
      where: { id: { in: fileIds }, courseId },
    });

    if (files.length !== fileIds.length) {
      throw { statusCode: 400, message: 'Some files do not belong to this course' };
    }

    // Update orders in transaction
    await db.$transaction(
      fileOrders.map(({ id, order }) =>
        db.courseFile.update({
          where: { id },
          data: { order },
        })
      )
    );

    logger.info({ courseId, fileCount: fileOrders.length, userId }, 'Course files reordered');
  }
}
