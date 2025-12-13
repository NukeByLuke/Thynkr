/**
 * Games Routes
 * Handles AI-powered game generation for arcade games (matching, quiz, fill-blanks)
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIService } from '../services/ai.service';
import { logger } from '../lib/logger';
import prisma from '../db/client';

const aiService = new AIService();

// =============================================================================
// Request/Response Schemas
// =============================================================================

const gameGenerationRequestSchema = z.object({
  gameType: z.enum(['MATCHING', 'QUIZ', 'FILL_BLANKS'], {
    errorMap: () => ({ message: 'Game type must be MATCHING, QUIZ, or FILL_BLANKS' }),
  }),
  fileIds: z
    .array(z.string().uuid('Invalid file ID format'))
    .min(1, 'At least one file must be selected')
    .max(10, 'Cannot select more than 10 files'),
  config: z.object({
    difficulty: z.enum(['easy', 'normal', 'hard'], {
      errorMap: () => ({ message: 'Difficulty must be easy, normal, or hard' }),
    }),
    count: z
      .number()
      .int()
      .min(5, 'Minimum 5 questions/pairs required')
      .max(50, 'Maximum 50 questions/pairs allowed'),
  }),
});

// Game content schemas for validation
const matchingPairSchema = z.object({
  term: z.string().min(1).max(100),
  definition: z.string().min(1).max(200),
});

const quizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  answer: z.string().min(1),
  explanation: z.string().optional(),
});

const fillBlankQuestionSchema = z.object({
  sentence: z.string().min(1),
  blank: z.string().min(1),
  options: z.array(z.string()).min(3).max(4),
  answer: z.string().min(1),
});

const gameContentResponseSchema = z.object({
  gameType: z.enum(['MATCHING', 'QUIZ', 'FILL_BLANKS']),
  content: z.union([
    z.array(matchingPairSchema),
    z.array(quizQuestionSchema),
    z.array(fillBlankQuestionSchema),
  ]),
});

// =============================================================================
// Game Generation Service
// =============================================================================

class GameGenerationService {
  /**
   * Generate matching pairs from text content
   */
  async generateMatching(content: string, count: number, difficulty: string): Promise<any[]> {
    const difficultyPrompt = {
      easy: 'Focus on basic concepts and definitions. Keep definitions simple and clear.',
      normal: 'Include moderate complexity concepts. Definitions should be comprehensive but concise.',
      hard: 'Include advanced concepts and nuanced definitions. Challenge understanding.',
    }[difficulty] || '';

    const prompt = `Generate exactly ${count} pairs of terms and definitions based on the following text. ${difficultyPrompt}

Format your response as a JSON array of objects with "term" and "definition" fields:
[
  {"term": "concept name", "definition": "concise definition under 15 words"},
  ...
]

Requirements:
- Terms should be key concepts from the text
- Definitions must be under 15 words for UI compatibility
- Ensure variety in concept types
- Use clear, educational language

Text content:
${content.substring(0, 16000)}`;

    return this.callAI(prompt, 'matching pairs');
  }

  /**
   * Generate quiz questions from text content
   */
  async generateQuiz(content: string, count: number, difficulty: string): Promise<any[]> {
    const difficultyPrompt = {
      easy: 'Ask straightforward factual questions about basic concepts.',
      normal: 'Include questions requiring understanding and application of concepts.',
      hard: 'Ask complex questions requiring analysis, synthesis, and critical thinking.',
    }[difficulty] || '';

    const prompt = `Generate exactly ${count} multiple choice questions based on the following text. ${difficultyPrompt}

Format your response as a JSON array of objects:
[
  {
    "question": "Clear, specific question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct option text (must match one of the options exactly)",
    "explanation": "Brief explanation why this answer is correct"
  },
  ...
]

Requirements:
- Questions should test understanding of key concepts
- Each question must have exactly 4 options
- Only one option should be clearly correct
- Distractors should be plausible but incorrect
- Keep questions and options concise

Text content:
${content.substring(0, 16000)}`;

    return this.callAI(prompt, 'quiz questions');
  }

  /**
   * Generate fill-in-the-blank questions from text content
   */
  async generateFillBlanks(content: string, count: number, difficulty: string): Promise<any[]> {
    const difficultyPrompt = {
      easy: 'Remove simple key terms and concepts that are clearly defined in the text.',
      normal: 'Remove important concepts that require understanding of context.',
      hard: 'Remove complex terms requiring deep comprehension and inference.',
    }[difficulty] || '';

    const prompt = `Generate exactly ${count} fill-in-the-blank questions based on the following text. ${difficultyPrompt}

Format your response as a JSON array of objects:
[
  {
    "sentence": "Complete sentence with _____ representing the blank",
    "blank": "The correct word/phrase that fills the blank",
    "options": ["Correct answer", "Distractor 1", "Distractor 2", "Distractor 3"],
    "answer": "Correct answer (must match the blank and one option exactly)"
  },
  ...
]

Requirements:
- Sentences should be meaningful and educational
- Use _____ to represent the blank clearly
- Provide 3-4 options including the correct answer
- Distractors should be contextually plausible
- Keep sentences under 150 characters for UI fit

Text content:
${content.substring(0, 16000)}`;

    return this.callAI(prompt, 'fill-in-the-blank questions');
  }

  /**
   * Call AI service with error handling and parsing
   */
  private async callAI(prompt: string, contentType: string): Promise<any[]> {
    try {
      const response = await aiService.generateCustomContent(prompt);
      
      // Parse JSON response
      const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, '').trim());
      
      if (!Array.isArray(parsed)) {
        throw new Error(`AI returned non-array response for ${contentType}`);
      }

      return parsed;
    } catch (error) {
      logger.error(`Failed to generate ${contentType}:`, error);
      throw new Error(`Failed to generate ${contentType}. Please try again.`);
    }
  }
}

const gameGenService = new GameGenerationService();

// =============================================================================
// Routes
// =============================================================================

export default async function gameRoutes(fastify: FastifyInstance) {
  // Generate game content
  fastify.post<{
    Body: z.infer<typeof gameGenerationRequestSchema>;
  }>('/games/generate', {
    preHandler: authenticate,
  }, async (request, reply) => {
    try {
      // Manual validation using Zod
      const validationResult = gameGenerationRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          message: validationResult.error.errors[0].message,
          details: validationResult.error.errors,
        });
      }

      const { gameType, fileIds, config } = validationResult.data;
      const userId = (request as AuthenticatedRequest).user?.userId;
      
      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      logger.info(`Generating ${gameType} game for user ${userId}`, {
        fileIds,
        config,
      });

      // Fetch file contents from database
      const files = await prisma.uploadedFile.findMany({
        where: {
          id: { in: fileIds },
          userId, // Ensure user owns the files
        },
        select: {
          id: true,
          originalName: true,
          extractedText: true,
        },
      });

      // Validate files exist and belong to user
      if (files.length !== fileIds.length) {
        const foundIds = files.map(f => f.id);
        const missingIds = fileIds.filter(id => !foundIds.includes(id));
        return reply.status(404).send({
          error: 'Files not found',
          message: `Files not found or access denied: ${missingIds.join(', ')}`,
        });
      }

      // Check for extracted text
      const filesWithoutText = files.filter(f => !f.extractedText);
      if (filesWithoutText.length > 0) {
        return reply.status(400).send({
          error: 'Files not processed',
          message: `Some files have not been processed yet: ${filesWithoutText.map(f => f.originalName).join(', ')}`,
        });
      }

      // Concatenate file contents (respecting token limits)
      const combinedContent = files
        .map(file => `=== ${file.originalName} ===\n${file.extractedText}`)
        .join('\n\n')
        .substring(0, 48000); // Limit to ~48k chars for token safety

      if (combinedContent.length < 100) {
        return reply.status(400).send({
          error: 'Insufficient content',
          message: 'Selected files do not contain enough text to generate meaningful game content.',
        });
      }

      // Generate game content based on type
      let gameContent: any[];
      
      switch (gameType) {
        case 'MATCHING':
          gameContent = await gameGenService.generateMatching(
            combinedContent,
            config.count,
            config.difficulty
          );
          break;
        case 'QUIZ':
          gameContent = await gameGenService.generateQuiz(
            combinedContent,
            config.count,
            config.difficulty
          );
          break;
        case 'FILL_BLANKS':
          gameContent = await gameGenService.generateFillBlanks(
            combinedContent,
            config.count,
            config.difficulty
          );
          break;
        default:
          return reply.status(400).send({
            error: 'Invalid game type',
            message: `Unsupported game type: ${gameType}`,
          });
      }

      // Validate generated content structure
      const response = {
        gameType,
        content: gameContent,
        generatedAt: new Date().toISOString(),
        sourceFiles: files.map(f => ({
          id: f.id,
          name: f.originalName,
        })),
        config,
      };

      // Validate response against schema
      try {
        gameContentResponseSchema.parse({
          gameType: response.gameType,
          content: response.content,
        });
      } catch (validationError) {
        logger.error('Generated game content failed validation:', validationError);
        return reply.status(500).send({
          error: 'Generation failed',
          message: 'Generated content does not meet quality standards. Please try again.',
        });
      }

      logger.info(`Successfully generated ${gameType} game`, {
        userId,
        contentCount: gameContent.length,
        difficulty: config.difficulty,
      });

      reply.send(response);
    } catch (error) {
      logger.error('Game generation failed:', error);
      return reply.status(500).send({
        error: 'Generation failed',
        message: 'An error occurred while generating the game. Please try again.',
      });
    }
  });

  // Health check endpoint for games service
  fastify.get('/games/health', async () => {
    return {
      status: 'ok',
      service: 'games',
      timestamp: new Date().toISOString(),
    };
  });
}