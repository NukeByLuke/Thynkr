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
   * Fisher-Yates shuffle algorithm for randomizing quiz options
   * @param array - Array to shuffle
   * @returns Shuffled array
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
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a Senior Academic Researcher with expertise in analyzing and summarizing complex educational materials. Your summaries are thorough, detailed, and capture all significant information.\n\n${languageInstruction}\n\nIMPORTANT: Use Chain-of-Thought reasoning in your analysis.`,
          },
          {
            role: 'user',
            content: `Please create a COMPREHENSIVE and DETAILED summary of the following content using this approach:\n\n1. FIRST: Extract and list ALL key concepts, main ideas, specific facts, numbers, statistics, examples, and critical points from the text. Be thorough and specific.\n\n2. THEN: Synthesize these elements into a detailed summary that:\n   - Captures ALL important information, not just high-level concepts\n   - Includes specific details, numbers, and examples when mentioned\n   - Maintains the depth and nuance of the original content\n   - Is proportional to the content length (longer content = longer, more detailed summary)\n   - Preserves key arguments, explanations, and reasoning\n\nYour summary should be as detailed as necessary to fully capture the content. For long-form content (lectures, videos, etc.), aim for 500-1000+ words. Do NOT oversimplify or omit important details.\n\nIMPORTANT: Verify all facts against the provided source material. Include specific examples, quotes, or data points when they appear in the text.\n\nText:\n${preparedText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
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
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a Senior Academic Researcher specializing in extracting key information and creating comprehensive study notes from educational content.\n\n${languageInstruction}`,
          },
          {
            role: 'user',
            content: `Please create comprehensive study notes from the following text. Include:
1. A list of 5-10 key points (bullet points) - extract the most critical concepts
2. Detailed notes covering all important concepts with all essential information needed

IMPORTANT: Verify all facts against the provided source material before outputting.

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
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a Senior Academic Content Specialist with expertise in creating highly accurate, context-aware educational assessments.\n\n${languageInstruction}`,
          },
          {
            role: 'user',
            content: `Create a quiz with exactly ${numQuestions} multiple-choice questions from the following text.

Difficulty level: ${difficulty}
${difficultyInstructions[difficulty]}

CRITICAL REQUIREMENTS:
- Generate highly accurate, context-aware questions that test genuine understanding
- Each question must have exactly 4 options with ONE clear correct answer
- The three incorrect options must be PLAUSIBLE DISTRACTORS that:
  * Sound reasonable but are factually wrong based on the text
  * Test common misconceptions or similar concepts
  * Are not obviously wrong at first glance
  * Are carefully crafted to challenge understanding

IMPORTANT: Verify every question and answer against the source text for 100% factual accuracy. The correct answer must be definitively supported by the provided text with no ambiguity.

Return the response in JSON format:
{
  "title": "Brief quiz title",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct and why the distractors are incorrect"
    }
  ]
}

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

      // Randomize options using Fisher-Yates shuffle to prevent predictable answer patterns
      if (result.questions) {
        result.questions = result.questions.map((question) => {
          if (question.options && question.options.length > 0) {
            // Shuffle the options array
            question.options = this.shuffleArray(question.options);
            // Ensure correctAnswer is still valid (it should match one of the shuffled options)
            // No need to update correctAnswer as it's the actual text, not an index
          }
          return question;
        });
      }

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
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a Senior Academic Researcher specializing in creating effective study flashcards from educational content.\n\n${languageInstruction}`,
          },
          {
            role: 'user',
            content: `Create exactly ${numCards} flashcards from the following text. Each flashcard should:
- Have a clear question or concept on the front
- Have a concise, accurate answer on the back
- Focus on key concepts, definitions, and important facts

IMPORTANT: Verify all facts against the provided source material before outputting.

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
   * TODO: Frontend should handle RTL text alignment for these languages
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
    
    return `CRITICAL OUTPUT INSTRUCTION: You must generate ALL content (summaries, questions, answers, notes, explanations) in the following language: ${languageName}.${rtlNote} Do not default to English unless the target language is English. Every single word of your response must be in ${languageName}.`;
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

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that generates educational content. Always respond with valid JSON in the exact format requested. Do not include any explanations outside the JSON.',
          },
          {
            role: 'user',
            content: sanitizedPrompt,
          },
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
        top_p: 0.9,
      });

      const content = completion.choices[0]?.message?.content?.trim() || '';
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Cache the result
      cache.set(cacheKey, content);
      
      logger.info('Custom content generated successfully', {
        promptLength: sanitizedPrompt.length,
        responseLength: content.length,
      });

      return content;
    } catch (error) {
      logger.error('Error generating custom content:', error);
      throw new Error('Failed to generate custom content');
    }
  }

  /**
   * Prepare text for AI processing with sanitization and truncation
   */
  private prepareText(text: string, maxChars: number = MAX_INPUT_CHARS): string {
    const sanitized = this.sanitizeInput(text);
    return this.truncateText(sanitized, maxChars);
  }
}
