/**
 * AI Service - Google Gemini-powered content generation for educational materials
 * Uses Gemini 2.0 Flash - blazing fast, highly accurate, cost-effective.
 * Handles summaries, notes, quizzes, and flashcards with caching and security validation.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import NodeCache from 'node-cache';
import { logger } from '../lib/logger';
import { config } from '../config';
import { DEFAULT_LANGUAGE } from '../constants/language.constants';

const cache = new NodeCache({ stdTTL: 3600 });

const MAX_INPUT_CHARS = 200000; // Gemini has much higher token limits

// Model Selection: Gemini 1.5 Flash - fastest, most cost-effective production model
const MODEL = 'gemini-1.5-flash-latest';

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
 * AIService - Main service class for Google Gemini-powered educational content generation
 */
export class AIService {
  private gemini: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = config.gemini?.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.gemini = new GoogleGenerativeAI(apiKey);
    this.model = this.gemini.getGenerativeModel({ 
      model: MODEL,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    logger.info('Google Gemini AI Service initialized with Gemini 1.5 Flash');
  }

  /**
   * Fisher-Yates shuffle algorithm for randomizing quiz options
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate a comprehensive summary using Gemini 2.0 Flash
   */
  async generateSummary(text: string, language: string = DEFAULT_LANGUAGE): Promise<GeneratedSummary> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text);
    const cacheKey = `summary_${normalizedLanguage}_${this.hashText(preparedText)}`;
    const cached = cache.get<GeneratedSummary>(cacheKey);

    if (cached) {
      logger.info('Returning cached summary');
      return cached;
    }

    try {
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      const prompt = `${languageInstruction}

You are a Senior Academic Researcher with expertise in creating comprehensive educational summaries.

You must respond with valid JSON in this exact format:
{"content": "your comprehensive summary here"}

Create a comprehensive, well-structured summary of the following text. The summary should:
- Capture all key concepts and main ideas
- Be organized with clear sections if the content warrants it
- Use bullet points for lists of items
- Maintain academic accuracy while being accessible

Text:
${preparedText}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      const parsed = JSON.parse(content) as GeneratedSummary;

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate summary');
      throw new Error(error.message || 'Failed to generate summary. Please try again.');
    }
  }

  /**
   * Generate structured study notes using Gemini 2.0 Flash
   */
  async generateNotes(text: string, language: string = DEFAULT_LANGUAGE): Promise<GeneratedNotes> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text);
    const cacheKey = `notes_${normalizedLanguage}_${this.hashText(preparedText)}`;
    const cached = cache.get<GeneratedNotes>(cacheKey);

    if (cached) {
      logger.info('Returning cached notes');
      return cached;
    }

    try {
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      const prompt = `${languageInstruction}

You are a Senior Academic Note-Taker specializing in creating comprehensive study notes.

You must respond with valid JSON in this exact format:
{"keyPoints": ["point 1", "point 2", ...], "detailed": "detailed notes here"}

Create detailed study notes from the following text. Include:
1. Key Points: 5-10 essential bullet points capturing the most important concepts
2. Detailed Notes: Comprehensive notes with headers, explanations, and examples

Text:
${preparedText}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      const parsed = JSON.parse(content) as GeneratedNotes;

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate notes');
      throw new Error(error.message || 'Failed to generate notes. Please try again.');
    }
  }

  /**
   * Generate a quiz with multiple-choice questions using Gemini 2.0 Flash
   */
  async generateQuiz(
    text: string,
    numQuestions: number,
    difficulty: QuizDifficulty,
    language: string = DEFAULT_LANGUAGE
  ): Promise<GeneratedQuiz> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text, 120000); // Gemini can handle much more
    const cacheKey = `quiz_${normalizedLanguage}_${this.hashText(preparedText)}_${numQuestions}_${difficulty}`;
    const cached = cache.get<GeneratedQuiz>(cacheKey);

    if (cached) {
      logger.info('Returning cached quiz');
      return cached;
    }

    const difficultyInstructions: Record<QuizDifficulty, string> = {
      EASY: 'Create straightforward questions testing basic recall and understanding of key facts.',
      MEDIUM: 'Create questions requiring understanding of concepts and ability to apply knowledge.',
      HARD: 'Create challenging questions requiring deep analysis, synthesis, and critical thinking.',
    };

    try {
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      const prompt = `${languageInstruction}

You are a Senior Academic Content Specialist with expertise in creating highly accurate, context-aware educational assessments.

You must respond with valid JSON in this exact format:
{"title": "Quiz Title", "questions": [{"question": "Question text?", "options": ["Option A text", "Option B text", "Option C text", "Option D text"], "correctAnswer": "The exact text of the correct option", "explanation": "Why this answer is correct"}]}

IMPORTANT: The "correctAnswer" field must contain the EXACT text of the correct option (not just a letter like "A").

Create a quiz with exactly ${numQuestions} multiple-choice questions from the following text.

Difficulty level: ${difficulty}
${difficultyInstructions[difficulty]}

CRITICAL REQUIREMENTS:
- Generate highly accurate, context-aware questions that test genuine understanding
- Each question must have exactly 4 options with ONE clear correct answer
- The three incorrect options must be PLAUSIBLE DISTRACTORS that:
  * Sound reasonable but are factually wrong based on the text
  * Test common misconceptions or similar concepts
  * Are not obviously wrong at first glance

IMPORTANT: Verify every question and answer against the source text for 100% factual accuracy.

Text:
${preparedText}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      const parsed = JSON.parse(content) as GeneratedQuiz;

      // Process questions: handle correctAnswer and shuffle options
      if (parsed.questions) {
        parsed.questions = parsed.questions.map((question) => {
          if (question.options && question.options.length > 0) {
            // If correctAnswer is a letter (A, B, C, D), convert to actual option text
            const letterIndex = ['A', 'B', 'C', 'D'].indexOf(question.correctAnswer?.toUpperCase());
            if (letterIndex !== -1 && question.options[letterIndex]) {
              question.correctAnswer = question.options[letterIndex];
            }
            
            // Shuffle options after fixing correctAnswer reference
            question.options = this.shuffleArray(question.options);
          }
          return question;
        });
      }

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate quiz');
      throw new Error(error.message || 'Failed to generate quiz. Please try again.');
    }
  }

  /**
   * Generate flashcards from the text using Gemini 2.0 Flash
   */
  async generateFlashcards(
    text: string,
    numCards: number,
    language: string = DEFAULT_LANGUAGE
  ): Promise<GeneratedFlashcards> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text, 100000);
    const cacheKey = `flashcards_${normalizedLanguage}_${this.hashText(preparedText)}_${numCards}`;
    const cached = cache.get<GeneratedFlashcards>(cacheKey);

    if (cached) {
      logger.info('Returning cached flashcards');
      return cached;
    }

    try {
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      const prompt = `${languageInstruction}

You are a Senior Academic Researcher specializing in creating effective study flashcards from educational content.

You must respond with valid JSON in this exact format:
{"title": "Flashcard Set Title", "cards": [{"front": "Question/Concept", "back": "Answer/Explanation"}]}

Create exactly ${numCards} flashcards from the following text. Each flashcard should:
- Have a clear question or concept on the front
- Have a concise, accurate answer on the back
- Focus on key concepts, definitions, and important facts

IMPORTANT: Verify all facts against the provided source material.

Text:
${preparedText}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      const parsed = JSON.parse(content) as GeneratedFlashcards;

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate flashcards');
      throw new Error(error.message || 'Failed to generate flashcards. Please try again.');
    }
  }

  /**
   * Generate custom content based on a provided prompt
   * Used for game generation and other flexible AI tasks
   */
  async generateCustomContent(prompt: string): Promise<string> {
    const cacheKey = `custom_${this.hashText(prompt)}`;
    const cached = cache.get<string>(cacheKey);

    if (cached) {
      logger.info('Returning cached custom content');
      return cached;
    }

    try {
      const sanitizedPrompt = this.sanitizeInput(prompt);

      if (sanitizedPrompt.length < 10) {
        throw new Error('Prompt too short for meaningful generation');
      }

      const fullPrompt = `You are an AI assistant that generates educational content. Always respond with valid JSON in the exact format requested. Do not include any explanations outside the JSON.

${sanitizedPrompt}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      const content = response.text().trim();

      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      cache.set(cacheKey, content);

      logger.info('Custom content generated successfully', {
        promptLength: sanitizedPrompt.length,
        responseLength: content.length,
      });

      return content;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate custom content');
      throw new Error(error.message || 'Failed to generate custom content');
    }
  }

  /**
   * Generate content from audio file
   * NOTE: Gemini doesn't have a Whisper equivalent yet. This method is kept for compatibility
   * but will throw an error. YouTube transcription should use captions instead.
   */
  async generateFromAudio(
    _audioBase64: string,
    _mimeType: string
  ): Promise<{ transcript: string; summary: string; title: string; keyConcepts: string[] }> {
    try {
      logger.warn('Audio transcription requested but Gemini does not support audio-to-text yet');
      throw new Error('Audio transcription is not supported with Gemini. Please ensure YouTube videos have captions available.');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate content from audio');
      throw new Error(error.message || 'Failed to process audio content');
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
      hash = hash & hash;
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
   * Get human-readable language name from language code
   */
  private getLanguageName(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'pt-br': 'Brazilian Portuguese',
      'pt-pt': 'European Portuguese',
      'zh': 'Chinese',
      'zh-cn': 'Simplified Chinese',
      'zh-tw': 'Traditional Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'vi': 'Vietnamese',
      'th': 'Thai',
      'id': 'Indonesian',
      'ms': 'Malay',
      'hi': 'Hindi',
      'pa': 'Punjabi',
      'ar': 'Arabic',
      'he': 'Hebrew',
      'tr': 'Turkish',
      'ru': 'Russian',
      'pl': 'Polish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'uk': 'Ukrainian',
      'bg': 'Bulgarian',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'nl': 'Dutch',
      'el': 'Greek',
      'ca': 'Catalan',
      'sk': 'Slovak',
      'hr': 'Croatian',
      'sr': 'Serbian',
    };
    return languageMap[languageCode.toLowerCase()] || languageCode;
  }

  /**
   * Check if a language uses right-to-left text direction
   */
  private isRTLLanguage(languageCode: string): boolean {
    const rtlLanguages = ['ar', 'he'];
    return rtlLanguages.includes(languageCode.toLowerCase());
  }

  /**
   * Build critical language instruction for system prompt
   */
  private buildLanguageInstruction(languageCode: string): string {
    const languageName = this.getLanguageName(languageCode);
    const rtlNote = this.isRTLLanguage(languageCode)
      ? ' Note: This is an RTL (right-to-left) language.'
      : '';

    return `CRITICAL OUTPUT INSTRUCTION: You must generate ALL content in ${languageName}.${rtlNote} Every single word of your response must be in ${languageName}.`;
  }

  /**
   * Sanitize user input to prevent prompt injection attacks
   */
  private sanitizeInput(text: string): string {
    let sanitized = text;
    let hasWarnings = false;

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        logger.warn({ pattern: pattern.source }, 'Potential prompt injection detected');
        hasWarnings = true;
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
    }

    // Remove suspicious code blocks
    sanitized = sanitized.replace(/```[\s\S]*?```/g, (match) => {
      if (/system|assistant|prompt|instruction/i.test(match)) {
        logger.warn('Removed suspicious code block');
        return '[CODE BLOCK REMOVED]';
      }
      return match;
    });

    // Remove control characters
    sanitized = sanitized.replace(new RegExp('[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]', 'g'), '');

    // Limit repeated characters
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
