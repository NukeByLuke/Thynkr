/**
 * AI Service - Google Gemini-powered content generation for educational materials
 * Uses Gemini 1.5 Pro for reasoning-heavy tasks and Gemini 1.5 Flash for high-velocity tasks.
 * Handles summaries, notes, quizzes, and flashcards with caching and security validation.
 */

import { GoogleGenerativeAI, GenerativeModel, SchemaType } from '@google/generative-ai';
import NodeCache from 'node-cache';
import { logger } from '../lib/logger';
import { config } from '../config';
import { DEFAULT_LANGUAGE } from '../constants/language.constants';

const cache = new NodeCache({ stdTTL: 3600 });

const MAX_INPUT_CHARS = 48000;
const MAX_OUTPUT_TOKENS = 2000;

// Model Selection Strategy:
// - Gemini 2.5 Pro: Complex reasoning, summaries, notes (requires deep understanding)
// - Gemini 2.5 Flash: High-velocity tasks like quizzes and flashcards
const GEMINI_PRO_MODEL = 'gemini-2.5-pro';
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';

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
 * Architecture: Uses Gemini 1.5 Pro for deep analysis and Gemini 1.5 Flash for speed-critical tasks
 */
export class AIService {
  private genAI: GoogleGenerativeAI;
  private proModel: GenerativeModel;
  private flashModel: GenerativeModel;

  constructor() {
    const apiKey = config.gemini.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Initialize models with appropriate configurations
    this.proModel = this.genAI.getGenerativeModel({
      model: GEMINI_PRO_MODEL,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2500,
      },
    });

    this.flashModel = this.genAI.getGenerativeModel({
      model: GEMINI_FLASH_MODEL,
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    });

    logger.info('Gemini AI Service initialized with Pro and Flash models');
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
   * Generate a concise summary of educational text content using Gemini 1.5 Pro
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
      
      const systemPrompt = `You are a Senior Academic Researcher with expertise in analyzing and summarizing complex educational materials. Your summaries are thorough, detailed, and capture all significant information.

${languageInstruction}

IMPORTANT: Use Chain-of-Thought reasoning in your analysis. Your summaries should be comprehensive, easy to read, and educational.`;

      const userPrompt = `Please create a COMPREHENSIVE and DETAILED summary of the following content using this approach:

1. FIRST: Extract and list ALL key concepts, main ideas, specific facts, numbers, statistics, examples, and critical points from the text. Be thorough and specific.

2. THEN: Synthesize these elements into a detailed summary that:
   - Captures ALL important information, not just high-level concepts
   - Includes specific details, numbers, and examples when mentioned
   - Maintains the depth and nuance of the original content
   - Is proportional to the content length (longer content = longer, more detailed summary)
   - Preserves key arguments, explanations, and reasoning

Your summary should be as detailed as necessary to fully capture the content. For long-form content (lectures, videos, etc.), aim for 500-1000+ words. Do NOT oversimplify or omit important details.

IMPORTANT: Verify all facts against the provided source material. Include specific examples, quotes, or data points when they appear in the text.

Text:
${preparedText}`;

      // Use Pro model for deep analysis tasks
      const result = await this.proModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      });

      const content = result.response.text() || '';
      const generatedResult = { content };

      cache.set(cacheKey, generatedResult);
      return generatedResult;
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate summary with Gemini');
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Generate structured notes from the text using Gemini 1.5 Pro
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
      
      // Create model with JSON response type for structured output
      const jsonModel = this.genAI.getGenerativeModel({
        model: GEMINI_PRO_MODEL,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              keyPoints: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'List of 5-10 key points extracted from the content',
              },
              detailed: {
                type: SchemaType.STRING,
                description: 'Detailed notes covering all important concepts',
              },
            },
            required: ['keyPoints', 'detailed'],
          },
        },
      });

      const prompt = `You are a Senior Academic Researcher specializing in extracting key information and creating comprehensive study notes from educational content.

${languageInstruction}

Please create comprehensive study notes from the following text. Include:
1. A list of 5-10 key points (bullet points) - extract the most critical concepts
2. Detailed notes covering all important concepts with all essential information needed

IMPORTANT: Verify all facts against the provided source material before outputting.

Text:
${preparedText}`;

      const result = await jsonModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const content = result.response.text() || '{}';
      const parsed = JSON.parse(content) as GeneratedNotes;

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate notes with Gemini');
      throw new Error('Failed to generate notes');
    }
  }

  /**
   * Generate a quiz from the text using Gemini 1.5 Flash for extreme speed
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
      
      // Use Flash model with JSON schema for high-velocity quiz generation
      const jsonModel = this.genAI.getGenerativeModel({
        model: GEMINI_FLASH_MODEL,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: {
                type: SchemaType.STRING,
                description: 'Brief quiz title',
              },
              questions: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    question: { type: SchemaType.STRING },
                    options: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                    },
                    correctAnswer: { type: SchemaType.STRING },
                    explanation: { type: SchemaType.STRING },
                  },
                  required: ['question', 'options', 'correctAnswer', 'explanation'],
                },
              },
            },
            required: ['title', 'questions'],
          },
        },
      });

      const prompt = `You are a Senior Academic Content Specialist with expertise in creating highly accurate, context-aware educational assessments.

${languageInstruction}

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
  * Are carefully crafted to challenge understanding

IMPORTANT: Verify every question and answer against the source text for 100% factual accuracy. The correct answer must be definitively supported by the provided text with no ambiguity.

Text:
${preparedText}`;

      const result = await jsonModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const content = result.response.text() || '{}';
      const parsed = JSON.parse(content) as GeneratedQuiz;

      // Randomize options using Fisher-Yates shuffle to prevent predictable answer patterns
      if (parsed.questions) {
        parsed.questions = parsed.questions.map((question) => {
          if (question.options && question.options.length > 0) {
            question.options = this.shuffleArray(question.options);
          }
          return question;
        });
      }

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate quiz with Gemini Flash');
      throw new Error('Failed to generate quiz');
    }
  }

  /**
   * Generate flashcards from the text using Gemini 1.5 Flash for speed
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
      
      // Use Flash model with JSON schema for high-velocity flashcard generation
      const jsonModel = this.genAI.getGenerativeModel({
        model: GEMINI_FLASH_MODEL,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: {
                type: SchemaType.STRING,
                description: 'Brief flashcard set title',
              },
              cards: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    front: {
                      type: SchemaType.STRING,
                      description: 'Question or concept',
                    },
                    back: {
                      type: SchemaType.STRING,
                      description: 'Answer or explanation',
                    },
                  },
                  required: ['front', 'back'],
                },
              },
            },
            required: ['title', 'cards'],
          },
        },
      });

      const prompt = `You are a Senior Academic Researcher specializing in creating effective study flashcards from educational content.

${languageInstruction}

Create exactly ${numCards} flashcards from the following text. Each flashcard should:
- Have a clear question or concept on the front
- Have a concise, accurate answer on the back
- Focus on key concepts, definitions, and important facts

IMPORTANT: Verify all facts against the provided source material before outputting.

Text:
${preparedText}`;

      const result = await jsonModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const content = result.response.text() || '{}';
      const parsed = JSON.parse(content) as GeneratedFlashcards;

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate flashcards with Gemini Flash');
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
   * Generate custom content based on a provided prompt using Gemini Flash
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

      const systemPrompt = 'You are an AI assistant that generates educational content. Always respond with valid JSON in the exact format requested. Do not include any explanations outside the JSON.';

      const result = await this.flashModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${sanitizedPrompt}` }] }],
      });

      const content = result.response.text()?.trim() || '';
      
      if (!content) {
        throw new Error('Empty response from Gemini');
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
   * Generate content from audio file using Gemini 1.5 Pro multimodal capabilities
   * Used for YouTube video transcription when captions are unavailable
   * @param audioBase64 - Base64 encoded audio data
   * @param mimeType - Audio MIME type (e.g., 'audio/mp3', 'audio/aac')
   * @returns Generated transcript and summary
   */
  async generateFromAudio(
    audioBase64: string,
    mimeType: string
  ): Promise<{ transcript: string; summary: string; title: string; keyConcepts: string[] }> {
    try {
      logger.info({ mimeType }, 'Generating content from audio with Gemini Pro');

      const prompt = `Listen to this audio file deeply and analyze its content thoroughly. 

Your task is to:
1. Generate a comprehensive transcript of what is being said
2. Create a detailed, easy-to-read educational summary
3. Suggest an appropriate title for this content
4. Extract 5-10 key concepts or topics discussed

IMPORTANT: Even if the audio quality is not perfect, do your best to understand and transcribe the content. Focus on educational value.

Return your response in the following JSON format:
{
  "transcript": "Full transcript of the audio content...",
  "summary": "Comprehensive educational summary...",
  "title": "Suggested title for this content",
  "keyConcepts": ["concept1", "concept2", "concept3", ...]
}`;

      const result = await this.proModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
        },
      });

      const content = result.response.text() || '{}';
      const parsed = JSON.parse(content);

      logger.info({ 
        transcriptLength: parsed.transcript?.length || 0,
        summaryLength: parsed.summary?.length || 0,
      }, 'Audio content generated successfully');

      return {
        transcript: parsed.transcript || '',
        summary: parsed.summary || '',
        title: parsed.title || 'Untitled Audio Content',
        keyConcepts: parsed.keyConcepts || [],
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate content from audio');
      throw new Error('Failed to process audio content');
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
