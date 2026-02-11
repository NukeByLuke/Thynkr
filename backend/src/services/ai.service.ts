/**
 * AI Service - Google Gemini-powered content generation for educational materials
 * Uses Gemini 2.0 Flash - blazing fast, highly accurate, cost-effective.
 * Handles summaries, notes, quizzes, and flashcards with caching and security validation.
 */

import { GoogleAuth, AuthClient } from 'google-auth-library';
import NodeCache from 'node-cache';
import { logger } from '../lib/logger';
import { DEFAULT_LANGUAGE } from '../constants/language.constants';

const cache = new NodeCache({ stdTTL: 3600 });

const MAX_INPUT_CHARS = 200000; // Gemini has much higher token limits

// Model Selection: Gemini 2.5 Flash Lite - latest stable fast model
const MODEL = 'gemini-2.5-flash-lite';

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
  private auth: GoogleAuth;
  private authClient: AuthClient | null = null;

  constructor() {
    const credPath = process.env.GEMINI_APPLICATION_CREDENTIALS || '/app/gemini-credentials.json';
    this.auth = new GoogleAuth({
      keyFilename: credPath,
      scopes: ['https://www.googleapis.com/auth/generative-language'],
    });
    logger.info(`Google Gemini AI Service initialized with ${MODEL} (service account REST API)`);
  }

  /**
   * Call Gemini API directly via REST using service account auth
   */
  private async callGemini(prompt: string): Promise<string> {
    if (!this.authClient) {
      this.authClient = await this.auth.getClient();
    }
    const tokenResponse = await this.authClient.getAccessToken();
    if (!tokenResponse.token) {
      throw new Error('Failed to obtain access token for Gemini API');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResponse.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }
    return text;
  }

  /**
   * Clean JSON response from Gemini - removes markdown code fences and attempts to fix truncated JSON
   */
  private cleanJsonResponse(text: string): string {
    // Remove markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*\n?/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*\n?/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\n?```\s*$/, '');
    }
    cleaned = cleaned.trim();
    
    // Try to extract JSON object/array from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    // Attempt to fix truncated JSON by closing open brackets/braces
    if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
      // Count open brackets
      const openBraces = (cleaned.match(/{/g) || []).length;
      const closeBraces = (cleaned.match(/}/g) || []).length;
      const openBrackets = (cleaned.match(/\[/g) || []).length;
      const closeBrackets = (cleaned.match(/]/g) || []).length;

      // Try to close truncated strings first
      if (cleaned.match(/"[^"]*$/)) {
        cleaned += '"';
      }

      // Close arrays and objects
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        cleaned += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        cleaned += '}';
      }
    }

    return cleaned;
  }

  /**
   * Safely parse JSON with fallback extraction
   */
  private safeParseJson<T>(text: string, fallbackExtractor?: (text: string) => T): T {
    const cleaned = this.cleanJsonResponse(text);
    
    try {
      return JSON.parse(cleaned) as T;
    } catch (firstError) {
      // Try to fix common JSON issues
      let fixed = cleaned
        .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ':"$1"');  // Replace single quotes with double
      
      try {
        return JSON.parse(fixed) as T;
      } catch (secondError) {
        // If fallback extractor provided, use it
        if (fallbackExtractor) {
          return fallbackExtractor(text);
        }
        throw firstError;
      }
    }
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
   * Generate a comprehensive summary using Gemini 2.5 Flash Lite
   */
  async generateSummary(
    text: string,
    language: string = DEFAULT_LANGUAGE
  ): Promise<GeneratedSummary> {
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

Create a comprehensive, visually engaging, and well-structured summary of the following text. The summary should:
- **Title**: Start with a clear, engaging title (H1).
- **Structure**: Use Markdown headers (H2, H3) to organize content logically.
- **Formatting**: Use **bold** for key terms and concepts to improve scanning.
- **Readability**: Use bullet points and short paragraphs to make it easy on the eyes.
- **Key Takeaways**: End with a section highlighting the top 3-5 most important points.
- **Tone**: Professional, academic, yet easy to understand.

Text:
${preparedText}`;

      const content = await this.callGemini(prompt);
      
      // Use safe JSON parsing with fallback
      const parsed = this.safeParseJson<GeneratedSummary>(content, (rawText) => {
        // Fallback: try to extract content field from raw response
        const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim();
        
        // Try to extract just the content value if it looks like JSON
        const contentMatch = cleaned.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*}|"$)/);
        if (contentMatch) {
          // Unescape the content string
          const extractedContent = contentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          return { content: extractedContent };
        }
        
        // If it doesn't look like JSON at all, use the raw text as content
        if (!cleaned.startsWith('{')) {
          return { content: cleaned };
        }
        
        // Last resort: strip the JSON wrapper manually
        return { content: cleaned.replace(/^\s*\{\s*"content"\s*:\s*"|"\s*\}\s*$/g, '') };
      });

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate summary');
      throw new Error('Failed to generate summary. Please try again.');
    }
  }

  /**
   * Generate structured study notes using Gemini 2.5 Flash Lite
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

Create detailed study notes from the following text. Includes:

1. **Key Points**: 5-10 essential bullet points capturing the most important concepts. Make them concise and memorable.

2. **Detailed Notes**: Create a comprehensive set of notes using Markdown:
   - Use clear Headers ( ## Topic, ### Sub-topic ) to organize the hierarchy.
   - Use **bold** for definitions and key vocabulary.
   - Use *italics* for emphasis.
   - Use bullet points and numbered lists for clarity.
   - Include examples where relevant to clarify complex ideas.
   - Make the notes visually appealing and easy to skim.

Text:
${preparedText}`;

      const content = await this.callGemini(prompt);
      
      // Use safe JSON parsing with fallback
      const parsed = this.safeParseJson<GeneratedNotes>(content, (rawText) => {
        const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim();
        return { keyPoints: [], detailed: cleaned };
      });

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate notes');
      throw new Error('Failed to generate notes. Please try again.');
    }
  }

  /**
   * Generate a quiz with multiple-choice questions using Gemini 2.5 Flash Lite
   */
  async generateQuiz(
    text: string,
    numQuestions: number,
    difficulty: QuizDifficulty,
    language: string = DEFAULT_LANGUAGE
  ): Promise<GeneratedQuiz> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text, 120000); // Gemini can handle much more
    
    // Estimate max questions based on content length (roughly 1 question per 200 chars of content)
    const estimatedMaxQuestions = Math.max(10, Math.floor(preparedText.length / 200));
    const adjustedNumQuestions = Math.min(numQuestions, estimatedMaxQuestions);
    
    if (adjustedNumQuestions < numQuestions) {
      logger.info({ requested: numQuestions, adjusted: adjustedNumQuestions }, 'Reduced question count due to content length');
    }
    
    const cacheKey = `quiz_${normalizedLanguage}_${this.hashText(preparedText)}_${adjustedNumQuestions}_${difficulty}`;
    const cached = cache.get<GeneratedQuiz>(cacheKey);

    if (cached) {
      logger.info('Returning cached quiz');
      return cached;
    }

    const difficultyInstructions: Record<QuizDifficulty, string> = {
      EASY: 'Create straightforward questions testing basic recall and understanding of key facts.',
      MEDIUM:
        'Create questions requiring understanding of concepts and ability to apply knowledge.',
      HARD: 'Create challenging questions requiring deep analysis, synthesis, and critical thinking.',
    };

    try {
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      const prompt = `${languageInstruction}

You are a Senior Academic Content Specialist with expertise in creating highly accurate, context-aware educational assessments.

You must respond with valid JSON in this exact format:
{"title": "Quiz Title", "questions": [{"question": "Question text?", "options": ["Option A text", "Option B text", "Option C text", "Option D text"], "correctAnswer": "The exact text of the correct option", "explanation": "Why this answer is correct"}]}

IMPORTANT: The "correctAnswer" field must contain the EXACT text of the correct option (not just a letter like "A").

Create a quiz with exactly ${adjustedNumQuestions} multiple-choice questions from the following text.

Difficulty level: ${difficulty}
${difficultyInstructions[difficulty]}

CRITICAL REQUIREMENTS:
- **Questions**: Clear, unambiguous, and directly based on the text.
- **Options**: exactly 4 options per question. ONE correct, THREE plausible distractors. Avoid "All of the above" or "None of the above".
- **OPTION LENGTH**: ALL four options MUST be similar in length and detail level. Do NOT make the correct answer longer or more detailed than the wrong answers. If the correct answer is a detailed explanation, make the wrong answers equally detailed. If the correct answer is brief, make wrong answers equally brief.
- **Accuracy**: Verify every question and answer against the source text for 100% factual accuracy.
- **Explanations**: Provide a clear, helpful explanation for the correct answer.

Make the quiz comprehensive and reflective of the material's core concepts.

Text:
${preparedText}`;

      const content = await this.callGemini(prompt);
      
      // Use safe JSON parsing
      const parsed = this.safeParseJson<GeneratedQuiz>(content);

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
      throw new Error('Failed to generate quiz. Please try again.');
    }
  }

  /**
   * Generate flashcards from the text using Gemini 2.5 Flash Lite
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

Create exactly ${numCards} high-quality flashcards from the following text. Each flashcard should:
- **Front**: A clear, specific question, term, or concept. Keep it short and punchy.
- **Back**: A clear, accurate, and easy-to-read explanation.
  - Use bullet points if the answer has multiple parts.
  - Keep it focused on the core concept.
- **Variety**: Cover definitions, key concepts, cause-and-effect relationships, and major facts.

IMPORTANT: Verify all facts against the provided source material. Ensure the content is easy to read on a card.

Text:
${preparedText}`;

      const content = await this.callGemini(prompt);
      
      // Use safe JSON parsing with fallback
      const parsed = this.safeParseJson<GeneratedFlashcards>(content, (rawText) => {
        const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim();
        return { title: 'Flashcards', cards: [{ front: 'Error', back: cleaned }] };
      });

      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate flashcards');
      throw new Error('Failed to generate flashcards. Please try again.');
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

      const content = (await this.callGemini(fullPrompt)).trim();

      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      cache.set(cacheKey, content);

      logger.info(
        { promptLength: sanitizedPrompt.length, responseLength: content.length },
        'Custom content generated successfully'
      );

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
      throw new Error(
        'Audio transcription is not supported with Gemini. Please ensure YouTube videos have captions available.'
      );
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
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      'pt-br': 'Brazilian Portuguese',
      'pt-pt': 'European Portuguese',
      zh: 'Chinese',
      'zh-cn': 'Simplified Chinese',
      'zh-tw': 'Traditional Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      vi: 'Vietnamese',
      th: 'Thai',
      id: 'Indonesian',
      ms: 'Malay',
      hi: 'Hindi',
      pa: 'Punjabi',
      ar: 'Arabic',
      he: 'Hebrew',
      tr: 'Turkish',
      ru: 'Russian',
      pl: 'Polish',
      cs: 'Czech',
      hu: 'Hungarian',
      ro: 'Romanian',
      uk: 'Ukrainian',
      bg: 'Bulgarian',
      sv: 'Swedish',
      no: 'Norwegian',
      da: 'Danish',
      fi: 'Finnish',
      nl: 'Dutch',
      el: 'Greek',
      ca: 'Catalan',
      sk: 'Slovak',
      hr: 'Croatian',
      sr: 'Serbian',
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
    // eslint-disable-next-line no-control-regex
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
