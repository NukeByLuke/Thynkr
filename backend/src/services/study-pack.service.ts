import prisma from '../db/client';
import { createHash, randomBytes } from 'crypto';
import { logger } from '../lib/logger';
import fs from 'fs/promises';
import path from 'path';
import { FileProcessorService } from './file-processor.service';
import { AIService, QuizDifficulty } from './ai.service';

const db = prisma as any;

// Types
export interface CreateStudyPackInput {
  title: string;
  courseId?: string | null;
  fileIds: string[];
  quiz?: {
    count: number;
    difficulty: QuizDifficulty;
  };
  cards?: {
    count: number;
  };
  userId: string;
  userRole: string;
  refresh?: boolean;
}

export interface PageContent {
  pageNumber: number;
  heading: string;
  content: string;
}

export interface FileAccessResult {
  files: any[];
  courseId: string | null;
  fileType: 'course' | 'uploaded';
}

// Supported file types for text extraction
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

/**
 * Service class for study pack business logic
 */
export class StudyPackService {
  private fileProcessor: FileProcessorService;
  private aiService: AIService | null;

  constructor(aiService?: AIService) {
    this.fileProcessor = new FileProcessorService();
    this.aiService = aiService || null;
  }

  /**
   * Check if a file type supports AI text extraction
   */
  isAICompatibleFile(fileType: string): boolean {
    return SUPPORTED_FILE_TYPES.includes(fileType) || fileType.startsWith('text/');
  }

  /**
   * Generate a hash from sorted file IDs for idempotency
   */
  generateFileHash(fileIds: string[]): string {
    const sorted = [...fileIds].sort();
    return createHash('sha256').update(sorted.join(',')).digest('hex').substring(0, 32);
  }

  /**
   * Generate a share token
   */
  createShareToken(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Get user's preferred language from the database
   */
  async getUserLanguage(userId: string): Promise<string> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true },
    });
    return user?.preferredLanguage || 'en';
  }

  /**
   * Verify user has access to multiple files (supports both CourseFile and UploadedFile)
   */
  async verifyFilesAccess(
    fileIds: string[],
    userId: string,
    userRole: string
  ): Promise<FileAccessResult> {
    // First, try to find files as CourseFiles
    const courseFiles = await db.courseFile.findMany({
      where: { id: { in: fileIds } },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            createdBy: true,
            visibility: true,
          },
        },
      },
    });

    // If all files found as CourseFiles, verify access
    if (courseFiles.length === fileIds.length) {
      // Check access for all course files
      for (const file of courseFiles) {
        const isOwner = file.course.createdBy === userId;
        const isPublic = file.course.visibility === 'PUBLIC';
        const canViewPublic = userRole === 'PREMIUM' || userRole === 'ADMIN';

        if (!isOwner && !(isPublic && canViewPublic)) {
          throw { statusCode: 403, message: `Access denied to file: ${file.name}` };
        }
      }

      // Determine courseId (use first file's course, or null if mixed)
      const courseIds = [...new Set(courseFiles.map((f: any) => f.course.id))] as string[];
      const courseId: string | null = courseIds.length === 1 ? courseIds[0] : null;

      return { files: courseFiles, courseId, fileType: 'course' };
    }

    // If not all files are CourseFiles, try UploadedFiles
    const uploadedFiles = await db.uploadedFile.findMany({
      where: {
        id: { in: fileIds },
        userId, // User can only access their own uploaded files
        status: 'COMPLETED', // Only completed files
      },
    });

    if (uploadedFiles.length === fileIds.length) {
      return { files: uploadedFiles, courseId: null, fileType: 'uploaded' };
    }

    // If some files found but not all, check what's missing
    const foundCourseIds = courseFiles.map((f: any) => f.id);
    const foundUploadedIds = uploadedFiles.map((f: any) => f.id);
    const allFoundIds = [...foundCourseIds, ...foundUploadedIds];
    const missingIds = fileIds.filter((id) => !allFoundIds.includes(id));

    if (missingIds.length > 0) {
      throw {
        statusCode: 404,
        message: `Files not found or access denied: ${missingIds.join(', ')}`,
      };
    }

    // Mixed file types - not supported
    throw { statusCode: 400, message: 'Cannot mix course files and uploaded files in a study pack' };
  }

  /**
   * Get or extract text from a file (CourseFile or UploadedFile)
   */
  async getFileText(
    fileId: string,
    filePath: string,
    fileType: string,
    isCourseFile: boolean
  ): Promise<string> {
    if (isCourseFile) {
      // For CourseFile, check CourseFileAI for cached text
      const existing = await db.courseFileAI.findUnique({
        where: { fileId },
        select: { extractedText: true },
      });

      if (existing?.extractedText) {
        return existing.extractedText;
      }

      // Check if file exists
      const fullPath = path.resolve(filePath);
      try {
        await fs.access(fullPath);
      } catch {
        throw new Error(`File not found: ${filePath}`);
      }

      // Extract text
      const extractedText = await this.fileProcessor.extractText(fullPath, fileType);

      // Cache extracted text in CourseFileAI
      await db.courseFileAI.upsert({
        where: { fileId },
        create: {
          fileId,
          extractedText,
        },
        update: {
          extractedText,
        },
      });

      return extractedText;
    } else {
      // For UploadedFile, check extractedText directly on the record
      const uploadedFile = await db.uploadedFile.findUnique({
        where: { id: fileId },
        select: { extractedText: true },
      });

      if (uploadedFile?.extractedText) {
        return uploadedFile.extractedText;
      }

      // Check if file exists
      const fullPath = path.resolve(filePath);
      try {
        await fs.access(fullPath);
      } catch {
        throw new Error(`File not found: ${filePath}`);
      }

      // Extract text
      const extractedText = await this.fileProcessor.extractText(fullPath, fileType);

      // Cache extracted text directly on UploadedFile
      await db.uploadedFile.update({
        where: { id: fileId },
        data: { extractedText },
      });

      return extractedText;
    }
  }

  /**
   * Paginate text into ~300-500 word pages with headings
   */
  paginateContent(
    sections: { fileName: string; text: string }[],
    wordsPerPage: number = 400
  ): PageContent[] {
    const pages: PageContent[] = [];
    let currentPage: PageContent = { pageNumber: 1, heading: '', content: '' };
    let currentWordCount = 0;

    for (const section of sections) {
      // Create a heading for each file section
      const paragraphs = section.text.split(/\n\n+/).filter((p) => p.trim());

      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        const words = paragraph.split(/\s+/).length;

        // If adding this paragraph exceeds the limit, start a new page
        if (currentWordCount + words > wordsPerPage && currentWordCount > 0) {
          pages.push({ ...currentPage });
          currentPage = {
            pageNumber: pages.length + 1,
            heading: section.fileName,
            content: '',
          };
          currentWordCount = 0;
        }

        // Set heading if this is the first content on the page
        if (!currentPage.heading) {
          currentPage.heading = section.fileName;
        }

        // Add paragraph
        currentPage.content += (currentPage.content ? '\n\n' : '') + paragraph;
        currentWordCount += words;
      }
    }

    // Don't forget the last page
    if (currentPage.content) {
      pages.push(currentPage);
    }

    return pages;
  }

  /**
   * Extract text from all files
   */
  async extractFileTexts(
    files: any[],
    fileType: 'course' | 'uploaded'
  ): Promise<{ fileName: string; text: string }[]> {
    const compatibleFiles = files.filter((f: any) => this.isAICompatibleFile(f.fileType));
    
    if (compatibleFiles.length === 0) {
      throw {
        statusCode: 400,
        message: 'No compatible files for AI processing',
        supportedTypes: SUPPORTED_FILE_TYPES,
      };
    }

    logger.info(
      { fileCount: compatibleFiles.length, fileType },
      'Extracting text from files for study pack'
    );

    const fileTexts: { fileName: string; text: string }[] = [];

    for (const file of compatibleFiles) {
      try {
        const fileName = fileType === 'course' ? file.name : file.originalName;
        const isCourseFile = fileType === 'course';
        const text = await this.getFileText(file.id, file.filePath, file.fileType, isCourseFile);
        fileTexts.push({ fileName, text });
      } catch (error: any) {
        logger.warn(
          { fileId: file.id, error: error.message },
          'Failed to extract text from file'
        );
      }
    }

    if (fileTexts.length === 0) {
      throw { statusCode: 400, message: 'Could not extract text from any files' };
    }

    return fileTexts;
  }

  /**
   * Create a new study pack
   */
  async createStudyPack(input: CreateStudyPackInput): Promise<any> {
    if (!this.aiService) {
      throw { statusCode: 503, message: 'AI service not available' };
    }

    const startTime = Date.now();

    // Verify access to all files
    const { files, courseId, fileType } = await this.verifyFilesAccess(
      input.fileIds,
      input.userId,
      input.userRole
    );

    // Generate file hash for idempotency
    const fileHash = this.generateFileHash(input.fileIds);

    // Check for existing study pack with same files (unless refresh)
    if (!input.refresh) {
      const existing = await db.studyPack.findUnique({
        where: {
          ownerId_fileHash: {
            ownerId: input.userId,
            fileHash,
          },
        },
      });

      if (existing) {
        return {
          id: existing.id,
          cached: true,
          message: 'Study pack already exists for these files',
        };
      }
    }

    // Extract text from all files
    const fileTexts = await this.extractFileTexts(files, fileType);

    // Combine all text for AI generation
    const combinedText = fileTexts
      .map((f) => `## ${f.fileName}\n\n${f.text}`)
      .join('\n\n---\n\n');
    const language = await this.getUserLanguage(input.userId);

    // Generate paginated content
    const pages = this.paginateContent(fileTexts);

    // Generate quiz if requested
    let quiz = null;
    if (input.quiz) {
      const quizCount = input.quiz.count || 15;
      const difficulty = input.quiz.difficulty || 'MEDIUM';

      logger.info({ quizCount, difficulty }, 'Generating combined quiz');
      const generatedQuiz = await this.aiService.generateQuiz(
        combinedText,
        quizCount,
        difficulty,
        language
      );
      quiz = {
        title: generatedQuiz.title,
        questions: generatedQuiz.questions,
        difficulty,
      };
    }

    // Generate flashcards if requested
    let cards = null;
    if (input.cards) {
      const cardCount = input.cards.count || 30;

      logger.info({ cardCount }, 'Generating combined flashcards');
      const generatedCards = await this.aiService.generateFlashcards(
        combinedText,
        cardCount,
        language
      );
      cards = {
        title: generatedCards.title,
        cards: generatedCards.cards,
      };
    }

    // Create or update study pack
    const studyPack = await db.studyPack.upsert({
      where: {
        ownerId_fileHash: {
          ownerId: input.userId,
          fileHash,
        },
      },
      create: {
        ownerId: input.userId,
        courseId: input.courseId || courseId,
        fileIds: input.fileIds,
        fileHash,
        title: input.title,
        pages,
        quiz,
        cards,
      },
      update: {
        title: input.title,
        pages,
        quiz,
        cards,
        updatedAt: new Date(),
      },
    });

    const durationMs = Date.now() - startTime;

    logger.info({ studyPackId: studyPack.id, durationMs }, 'Study pack created');

    return {
      id: studyPack.id,
      title: studyPack.title,
      pageCount: pages.length,
      hasQuiz: !!quiz,
      hasCards: !!cards,
      cached: false,
      durationMs,
    };
  }

  /**
   * Update a study pack (rename, regenerate share token)
   */
  async updateStudyPack(
    studyPackId: string,
    userId: string,
    userRole: string,
    updates: {
      title?: string;
      generateShareToken?: boolean;
      removeShareToken?: boolean;
    }
  ): Promise<any> {
    const studyPack = await db.studyPack.findUnique({
      where: { id: studyPackId },
    });

    if (!studyPack) {
      throw { statusCode: 404, message: 'Study pack not found' };
    }

    // Check ownership
    if (studyPack.ownerId !== userId && userRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'Access denied' };
    }

    // Sharing requires Premium or Admin role
    if (updates.generateShareToken && userRole !== 'PREMIUM' && userRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'Sharing requires Premium or Admin access' };
    }

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.generateShareToken) updateData.shareToken = this.createShareToken();
    if (updates.removeShareToken) updateData.shareToken = null;

    const updated = await db.studyPack.update({
      where: { id: studyPackId },
      data: updateData,
    });

    logger.info({ studyPackId, userId }, 'Study pack updated');

    return {
      id: updated.id,
      title: updated.title,
      shareToken: updated.shareToken,
      message: 'Study pack updated',
    };
  }

  /**
   * Delete a study pack
   */
  async deleteStudyPack(studyPackId: string, userId: string, userRole: string): Promise<void> {
    const studyPack = await db.studyPack.findUnique({
      where: { id: studyPackId },
    });

    if (!studyPack) {
      throw { statusCode: 404, message: 'Study pack not found' };
    }

    // Check ownership
    if (studyPack.ownerId !== userId && userRole !== 'ADMIN') {
      throw { statusCode: 403, message: 'Access denied' };
    }

    await db.studyPack.delete({
      where: { id: studyPackId },
    });

    logger.info({ studyPackId, userId }, 'Study pack deleted');
  }
}
