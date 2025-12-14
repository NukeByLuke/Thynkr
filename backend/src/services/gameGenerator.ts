/**
 * Game Generator Service
 * RAG-based game content generation using AI and document content
 */

import { AIService } from './ai.service';
import { logger } from '../lib/logger';
import prisma from '../db/client';

const aiService = new AIService();

// =============================================================================
// Types
// =============================================================================

export type GameType = 'QUIZ' | 'MATCHING' | 'BLANKS';

export interface MatchingPair {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface BlankQuestion {
  sentence: string;
  blank: string;
  options: string[];
  answer: string;
}

export type GameContent = MatchingPair[] | QuizQuestion[] | BlankQuestion[];

interface GenerationConfig {
  count?: number;
  difficulty?: 'easy' | 'normal' | 'hard';
}

// =============================================================================
// Prompt Templates
// =============================================================================

class PromptTemplates {
  /**
   * Generate prompt for matching game
   */
  static matching(content: string, count: number, difficulty: string): string {
    const difficultyInstructions = {
      easy: 'Focus on basic concepts and definitions. Keep definitions simple and clear.',
      normal: 'Include moderate complexity concepts. Definitions should be comprehensive but concise.',
      hard: 'Include advanced concepts and nuanced definitions. Challenge understanding.',
    }[difficulty] || '';

    return `You are a strict exam proctor. Your goal is to create rapid-fire study materials.

CRITICAL SHORTNESS RULE:
- TERMS must be under 6 words.
- DEFINITIONS must be under 20 words maximum. Summarize aggressively. Do not copy long sentences.

CRITICAL FORMATTING RULE:
- Never use 'Fill in the blank' style definitions for matching pairs.
- Ensure text is plain string only (no Markdown, no LaTeX, no special formatting).

${difficultyInstructions}

Generate exactly ${count} pairs of terms and definitions.

Output Format (JSON array):
[
  {"term": "concept name", "definition": "concise definition under 20 words"},
  {"term": "another concept", "definition": "brief clear definition"},
  ...
]

Requirements:
- Terms should be key concepts directly from the text
- Terms MUST be under 6 words
- Definitions MUST be under 20 words for UI compatibility
- Ensure variety in concept types (definitions, processes, examples)
- Use clear, educational language
- Draw ONLY from the provided text content

Text Content:
${content.substring(0, 16000)}

Output only the JSON array, no additional text.`;
  }

  /**
   * Generate prompt for quiz game
   */
  static quiz(content: string, count: number, difficulty: string): string {
    const difficultyInstructions = {
      easy: 'Ask straightforward factual questions about basic concepts directly stated in the text.',
      normal: 'Include questions requiring understanding and application of concepts. Mix recall and comprehension.',
      hard: 'Ask complex questions requiring analysis, synthesis, and critical thinking. Include inference questions.',
    }[difficulty] || '';

    return `You are an expert tutor. Create a QUIZ game based strictly on the following text content.

${difficultyInstructions}

Generate exactly ${count} multiple choice questions.

Output Format (JSON array):
[
  {
    "question": "Clear, specific question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct option text (must match one of the options exactly)"
  },
  ...
]

Requirements:
- Questions should test understanding of key concepts from the text
- Each question MUST have exactly 4 options
- Only one option should be clearly correct
- Distractors should be plausible but incorrect
- Keep questions and options concise (under 100 characters each)
- Draw ONLY from the provided text content
- Answer must match one option word-for-word

Text Content:
${content.substring(0, 16000)}

Output only the JSON array, no additional text.`;
  }

  /**
   * Generate prompt for fill-in-the-blanks game
   */
  static blanks(content: string, count: number, difficulty: string): string {
    const difficultyInstructions = {
      easy: 'Remove simple key terms and concepts that are clearly defined in the text.',
      normal: 'Remove important concepts that require understanding of context.',
      hard: 'Remove complex terms requiring deep comprehension and inference.',
    }[difficulty] || '';

    return `You are an expert tutor. Create a FILL-IN-THE-BLANKS game based strictly on the following text content.

${difficultyInstructions}

Generate exactly ${count} fill-in-the-blank questions.

Output Format (JSON array):
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
- Draw ONLY from the provided text content
- Answer must match blank exactly

Text Content:
${content.substring(0, 16000)}

Output only the JSON array, no additional text.`;
  }
}

// =============================================================================
// Game Generator Service
// =============================================================================

export class GameGeneratorService {
  /**
   * Main entry point for game content generation
   * 
   * @param fileIds - Array of file IDs to use as source material
   * @param gameType - Type of game to generate (QUIZ, MATCHING, BLANKS)
   * @param config - Optional configuration (count, difficulty)
   * @returns Generated game content
   */
  async generateGameContent(
    fileIds: string[],
    gameType: GameType,
    config: GenerationConfig = {}
  ): Promise<GameContent> {
    const { count = 10, difficulty = 'normal' } = config;

    logger.info(`Generating ${gameType} game from ${fileIds.length} files`, {
      fileIds,
      count,
      difficulty,
    });

    try {
      // Step 1: Fetch content from files
      const content = await this.fetchFileContent(fileIds);

      // Step 2: Construct prompt based on game type
      const prompt = this.constructPrompt(content, gameType, count, difficulty);

      // Step 3: Call AI to generate content
      const gameContent = await this.callAI(prompt, gameType);

      // Step 4: Validate and return
      this.validateGameContent(gameContent, gameType, count);

      return gameContent;
    } catch (error) {
      logger.error(`Failed to generate ${gameType} game:`, error);
      throw error;
    }
  }

  /**
   * Fetch content from files (Database or Vector DB)
   * 
   * TODO: Integrate with Pinecone/Vector DB for semantic search
   * Currently fetches from PostgreSQL database
   */
  private async fetchFileContent(fileIds: string[]): Promise<string> {
    // Fetch files from database
    const files = await prisma.uploadedFile.findMany({
      where: {
        id: { in: fileIds },
      },
      select: {
        id: true,
        originalName: true,
        extractedText: true,
      },
    });

    if (files.length === 0) {
      throw new Error('No files found with provided IDs');
    }

    // Check for missing extracted text
    const filesWithoutText = files.filter(f => !f.extractedText);
    if (filesWithoutText.length > 0) {
      throw new Error(
        `Files not processed yet: ${filesWithoutText.map(f => f.originalName).join(', ')}`
      );
    }

    // Concatenate file contents with headers
    const combinedContent = files
      .map(file => `=== ${file.originalName} ===\n${file.extractedText}`)
      .join('\n\n')
      .substring(0, 48000); // Limit to ~48k chars for token safety

    if (combinedContent.length < 100) {
      throw new Error('Insufficient content in selected files');
    }

    return combinedContent;
  }

  /**
   * Construct AI prompt based on game type
   */
  private constructPrompt(
    content: string,
    gameType: GameType,
    count: number,
    difficulty: string
  ): string {
    switch (gameType) {
      case 'MATCHING':
        return PromptTemplates.matching(content, count, difficulty);
      case 'QUIZ':
        return PromptTemplates.quiz(content, count, difficulty);
      case 'BLANKS':
        return PromptTemplates.blanks(content, count, difficulty);
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }
  }

  /**
   * Call AI service and parse response
   */
  private async callAI(prompt: string, gameType: GameType): Promise<any[]> {
    try {
      const response = await aiService.generateCustomContent(prompt);
      
      // Parse JSON response (handle code blocks)
      const cleanedResponse = response
        .replace(/```json\n?|\n?```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(parsed)) {
        throw new Error(`AI returned non-array response for ${gameType}`);
      }

      // Filter out pairs that exceed character limits to prevent UI overflow
      if (gameType === 'MATCHING') {
        const validPairs = parsed.filter((pair: any) => {
          const termValid = pair.term && pair.term.length < 50;
          const definitionValid = pair.definition && pair.definition.length < 150;
          
          if (!termValid || !definitionValid) {
            logger.warn('Discarding oversized pair', {
              term: pair.term?.substring(0, 30),
              termLength: pair.term?.length,
              definitionLength: pair.definition?.length,
            });
          }
          
          return termValid && definitionValid;
        });

        if (validPairs.length < parsed.length * 0.5) {
          logger.error('Too many pairs exceeded limits, re-generation needed');
          throw new Error('Generated content exceeded size limits. Please try again.');
        }

        return validPairs;
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        logger.error('Failed to parse AI response as JSON:', error);
        throw new Error('AI returned invalid JSON format. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Validate generated game content
   */
  private validateGameContent(content: any[], gameType: GameType, expectedCount: number): void {
    if (content.length === 0) {
      throw new Error('AI generated empty content');
    }

    if (content.length < expectedCount * 0.7) {
      logger.warn(`Generated fewer items than requested: ${content.length}/${expectedCount}`);
    }

    // Type-specific validation
    switch (gameType) {
      case 'MATCHING':
        content.forEach((pair, idx) => {
          if (!pair.term || !pair.definition) {
            throw new Error(`Invalid matching pair at index ${idx}`);
          }
        });
        break;

      case 'QUIZ':
        content.forEach((question, idx) => {
          if (!question.question || !Array.isArray(question.options) || !question.answer) {
            throw new Error(`Invalid quiz question at index ${idx}`);
          }
          if (question.options.length !== 4) {
            throw new Error(`Quiz question ${idx} must have exactly 4 options`);
          }
        });
        break;

      case 'BLANKS':
        content.forEach((blank, idx) => {
          if (!blank.sentence || !blank.blank || !Array.isArray(blank.options) || !blank.answer) {
            throw new Error(`Invalid blank question at index ${idx}`);
          }
        });
        break;
    }
  }
}

// Export singleton instance
export const gameGeneratorService = new GameGeneratorService();
