/**
 * AI Service - OpenAI GPT-powered content generation for educational materials
 * Handles summaries, notes, quizzes, and flashcards with caching and security validation.
 */

import OpenAI from 'openai';
import NodeCache from 'node-cache';
import { logger } from '../lib/logger';
import { DEFAULT_LANGUAGE } from '../constants/language.constants';

const cache = new NodeCache({ stdTTL: 3600 });

const MAX_INPUT_CHARS = 48000;
const MAX_OUTPUT_TOKENS = 2000;

/**
 * Prompt injection detection patterns for security validation
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /forget\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /new\s+instructions?:/i,
  /system\s+prompt:/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+if\s+you/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /\[system\]/i,
  /\[assistant\]/i,
  /<\|?system\|?>/i,
  /<\|?assistant\|?>/i,
  /```\s*system/i,
];

export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface GeneratedSummary {
  content: string;
}

export interface GeneratedNotes {
  keyPoints: string[];
  detailed: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface GeneratedFlashcards {
  title: string;
  cards: Flashcard[];
}

/**
 * AIService - Main service class for OpenAI-powered educational content generation
 */
export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate a concise summary of educational text content
   * @param text - Raw text content to summarize
   * @param language - Target language for the summary (default: EN_US)
   * @returns Generated summary with caching support
   */
  async generateSummary(
    text: string,
    language: string = DEFAULT_LANGUAGE
  ): Promise<GeneratedSummary> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text, 12000);
    const cacheKey = `summary_${normalizedLanguage}_${this.hashText(preparedText)}`;
    const cached = cache.get<GeneratedSummary>(cacheKey);

    if (cached) {
      logger.info('Returning cached summary');
      return cached;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating concise, clear summaries of educational content. All responses must be written in the locale "${normalizedLanguage}".`,
          },
          {
            role: 'user',
            content: `Please provide a comprehensive but concise summary of the following text in the "${normalizedLanguage}" language. Focus on the main ideas, key concepts, and important conclusions:\n\n${preparedText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content || '';
      const result = { content };

      cache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate summary');
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Generate structured notes from the text
   */
  async generateNotes(text: string, language: string = DEFAULT_LANGUAGE): Promise<GeneratedNotes> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text, 12000);
    const cacheKey = `notes_${normalizedLanguage}_${this.hashText(preparedText)}`;
    const cached = cache.get<GeneratedNotes>(cacheKey);

    if (cached) {
      logger.info('Returning cached notes');
      return cached;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting key information and creating study notes from educational content. Respond strictly in the locale "${normalizedLanguage}".`,
          },
          {
            role: 'user',
            content: `Please create comprehensive study notes from the following text in the "${normalizedLanguage}" language. Include:
1. A list of 5-10 key points (bullet points)
2. Detailed notes covering all important concepts

Return the response in JSON format:
{
  "keyPoints": ["point 1", "point 2", ...],
  "detailed": "detailed notes here"
}

Text:
${preparedText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content) as GeneratedNotes;

      cache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate notes');
      throw new Error('Failed to generate notes');
    }
  }

  /**
   * Generate a quiz from the text
   */
  async generateQuiz(
    text: string,
    numQuestions: number,
    difficulty: QuizDifficulty,
    language: string = DEFAULT_LANGUAGE
  ): Promise<GeneratedQuiz> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text, 10000);
    const cacheKey = `quiz_${normalizedLanguage}_${this.hashText(preparedText)}_${numQuestions}_${difficulty}`;
    const cached = cache.get<GeneratedQuiz>(cacheKey);

    if (cached) {
      logger.info('Returning cached quiz');
      return cached;
    }

    const difficultyInstructions = {
      EASY: 'Create straightforward questions testing basic comprehension and recall.',
      MEDIUM:
        'Create moderately challenging questions requiring understanding and application of concepts.',
      HARD: 'Create challenging questions requiring critical thinking, analysis, and synthesis of information.',
    };

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating educational quizzes from study materials. All content must be produced in the locale "${normalizedLanguage}".`,
          },
          {
            role: 'user',
            content: `Create a quiz with exactly ${numQuestions} multiple-choice questions from the following text.

Difficulty level: ${difficulty}
${difficultyInstructions[difficulty]}

Each question should have 4 options (A, B, C, D) with only one correct answer.

Return the response in JSON format:
{
  "title": "Brief quiz title",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

All prompts, questions, options, and explanations must be written in the "${normalizedLanguage}" language.

Text:
${preparedText}`,
          },
        ],
        temperature: 0.8,
        max_tokens: MAX_OUTPUT_TOKENS,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content) as GeneratedQuiz;

      cache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate quiz');
      throw new Error('Failed to generate quiz');
    }
  }

  /**
   * Generate flashcards from the text
   */
  async generateFlashcards(
    text: string,
    numCards: number,
    language: string = DEFAULT_LANGUAGE
  ): Promise<GeneratedFlashcards> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text, 10000);
    const cacheKey = `flashcards_${normalizedLanguage}_${this.hashText(preparedText)}_${numCards}`;
    const cached = cache.get<GeneratedFlashcards>(cacheKey);

    if (cached) {
      logger.info('Returning cached flashcards');
      return cached;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating effective study flashcards from educational content. Provide all output in the locale "${normalizedLanguage}".`,
          },
          {
            role: 'user',
            content: `Create exactly ${numCards} flashcards from the following text. Each flashcard should:
- Have a clear question or concept on the front
- Have a concise, accurate answer on the back
- Focus on key concepts, definitions, and important facts

Return the response in JSON format:
{
  "title": "Brief flashcard set title",
  "cards": [
    {
      "front": "Question or concept",
      "back": "Answer or explanation"
    }
  ]
}

Ensure both sides of every flashcard are written in the "${normalizedLanguage}" language.

Text:
${preparedText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: MAX_OUTPUT_TOKENS,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content) as GeneratedFlashcards;

      cache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate flashcards');
      throw new Error('Failed to generate flashcards');
    }
  }

  /**
   * Truncate text to a maximum length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength) + '... [text truncated]';
  }

  /**
   * Create a simple hash of text for caching
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 1000); i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private normalizeLanguage(language?: string): string {
    if (!language) {
      return DEFAULT_LANGUAGE;
    }

    const normalized = language.toLowerCase();
    if (normalized.length < 2 || normalized.length > 10) {
      return DEFAULT_LANGUAGE;
    }

    return normalized;
  }

  /**
   * Sanitize user input to prevent prompt injection attacks
   * Returns sanitized text and logs warnings for suspicious content
   */
  private sanitizeInput(text: string): string {
    let sanitized = text;
    let hasWarnings = false;

    // Check for prompt injection patterns
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        logger.warn({ pattern: pattern.source }, 'Potential prompt injection detected');
        hasWarnings = true;
        // Remove the suspicious pattern
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
    }

    // Remove any potential markdown code blocks that might try to inject prompts
    sanitized = sanitized.replace(/```[\s\S]*?```/g, (match) => {
      // Keep code blocks but remove any that look like prompt injections
      if (/system|assistant|prompt|instruction/i.test(match)) {
        logger.warn('Removed suspicious code block');
        return '[CODE BLOCK REMOVED]';
      }
      return match;
    });

    // Remove control characters and null bytes
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Limit repeated characters (potential DoS)
    sanitized = sanitized.replace(/(.)\1{50,}/g, '$1'.repeat(50));

    if (hasWarnings) {
      logger.info(
        { originalLength: text.length, sanitizedLength: sanitized.length },
        'Input sanitized'
      );
    }

    return sanitized;
  }

  /**
   * Prepare text for AI processing with sanitization and truncation
   */
  private prepareText(text: string, maxChars: number = MAX_INPUT_CHARS): string {
    const sanitized = this.sanitizeInput(text);
    return this.truncateText(sanitized, maxChars);
  }
}
