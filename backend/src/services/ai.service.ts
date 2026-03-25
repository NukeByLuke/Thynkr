/**
 * AI Service - Google Gemini-powered content generation for educational materials
 * Uses Gemini 2.0 Flash - blazing fast, highly accurate, cost-effective.
 * Handles summaries, notes, quizzes, and flashcards with caching and security validation.
 */

import { GoogleAuth, AuthClient } from 'google-auth-library';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { logger } from '../lib/logger';
import { DEFAULT_LANGUAGE } from '../constants/language.constants';
import {
  normalizeQuizAnswerText,
  resolveQuizCorrectAnswerText,
} from '../utils/quiz-answer.utils';

const cache = new NodeCache({ stdTTL: 3600 });

const MAX_INPUT_CHARS = 200000; // Gemini has much higher token limits

// Model Selection: Gemini 2.5 Flash Lite - latest stable fast model
const MODEL = 'gemini-2.5-flash-lite';

interface GeminiGenerationConfigOverrides {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

interface GeminiRequestOptions {
  useGoogleSearch?: boolean;
}

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
export type QuizQuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';

export interface GeneratedSummary {
  content: string;
}

export interface GeneratedNotes {
  keyPoints: string[];
  detailed: string;
}

export interface QuizQuestion {
  questionType?: QuizQuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

export interface QuizImprovementTips {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
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
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable (transient failures)
   */
  private isRetryableError(status: number): boolean {
    // 429 = Rate limited, 500/502/503/504 = Server errors (transient)
    return status === 429 || status >= 500;
  }

  /**
   * Call Gemini API directly via REST using service account auth
   * Includes retry logic with exponential backoff for transient failures
   */
  private async callGemini(
    prompt: string,
    maxRetries: number = 3,
    generationConfigOverrides?: GeminiGenerationConfigOverrides,
    requestOptions?: GeminiRequestOptions
  ): Promise<string> {
    if (!this.authClient) {
      this.authClient = await this.auth.getClient();
    }
    const tokenResponse = await this.authClient.getAccessToken();
    if (!tokenResponse.token) {
      throw new Error('Failed to obtain access token for Gemini API');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const requestBody: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: generationConfigOverrides?.temperature ?? 0.7,
        topK: generationConfigOverrides?.topK ?? 40,
        topP: generationConfigOverrides?.topP ?? 0.95,
        maxOutputTokens: generationConfigOverrides?.maxOutputTokens ?? 16384,
      },
    };

    if (requestOptions?.useGoogleSearch) {
      requestBody.tools = [{ google_search: {} }];
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
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
          
          // Check if this is a retryable error
          if (this.isRetryableError(response.status) && attempt < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000); // 1s, 2s, 4s, max 8s
            logger.warn(
              { status: response.status, attempt: attempt + 1, backoffMs },
              `Gemini API transient error, retrying after ${backoffMs}ms...`
            );
            await this.delay(backoffMs);
            continue;
          }
          
          // Non-retryable error or max retries reached
          throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
        }

        const data = await response.json() as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Empty response from Gemini API');
        }
        return text;
      } catch (error: any) {
        lastError = error;
        
        // If it's a network error and we have retries left, retry
        if (attempt < maxRetries && !error.message?.includes('Gemini API error')) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000);
          logger.warn(
            { error: error.message, attempt: attempt + 1, backoffMs },
            `Network error calling Gemini, retrying after ${backoffMs}ms...`
          );
          await this.delay(backoffMs);
          continue;
        }
        
        throw error;
      }
    }
    
    // Should not reach here, but just in case
    throw lastError || new Error('Failed to call Gemini API after retries');
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
- **Format**: Output pure Markdown only. Do NOT output HTML tags such as <h1>, <h2>, <p>, <ul>, <li>, or <strong>.
- **Study Guide Handling**: If the source is a study guide/worksheet/review packet, do NOT summarize the guide structure or instructions. Summarize the underlying subject matter and concepts the guide is teaching.
- **Ignore Scaffolding**: Treat headings like "Study Guide", "Instructions", "Review Questions", "Checklist", and grading notes as scaffolding, not core content.
- **Concept-First Output**: Convert prompts/questions in the source into direct concept explanations.

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
    const hasTimestampMarkers =
      /\[(\d{2}:){1,2}\d{2}\]/.test(preparedText) || /\b\d{2}:\d{2}:\d{2}\b/.test(preparedText);
    const cacheKey = `notes_${normalizedLanguage}_${this.hashText(preparedText)}`;
    const cached = cache.get<GeneratedNotes>(cacheKey);

    if (cached) {
      logger.info('Returning cached notes');
      return cached;
    }

    try {
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);
      const timestampInstruction = hasTimestampMarkers
        ? `
The source appears to be timestamped (e.g. [00:02:14]).
- Include a section titled "## Timeline Highlights".
- Add timestamped bullets in that section using [HH:MM:SS] format.
- Include timestamps in key points where they help locate the moment in the source.
`
        : '';

      const prompt = `${languageInstruction}

You are a Senior Academic Note-Taker specializing in creating comprehensive study notes.

You must respond with valid JSON in this exact format:
{"keyPoints": ["point 1", "point 2", ...], "detailed": "detailed notes here"}

Create detailed study notes from the following text. Includes:

1. **Key Points**: 5-10 essential bullet points capturing the most important concepts. Make them concise and memorable.

2. **Detailed Notes**: Create a comprehensive set of notes using Markdown:
  - Use clear section headers ( ## Topic, ### Sub-topic ) to organize hierarchy into scannable chunks.
  - Make each ## section feel like a standalone "note card" focused on one concept.
   - Use **bold** for definitions and key vocabulary.
   - Use *italics* for emphasis.
   - Use bullet points and numbered lists for clarity.
   - Include examples where relevant to clarify complex ideas.
   - Make the notes visually appealing and easy to skim.
- **Format**: Output pure Markdown only. Do NOT output HTML tags such as <h1>, <h2>, <p>, <ul>, <li>, or <strong>.
- **Study Guide Handling**: If the source is a study guide/worksheet/review packet, extract and explain the underlying academic concepts. Do NOT produce notes about the guide's formatting or directions.
- **Question-to-Concept Conversion**: If the source contains review questions, convert them into concise concept explanations and answer-ready notes.
${timestampInstruction}

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
   * Generate a quiz using one or more supported question formats.
   */
  async generateQuiz(
    text: string,
    numQuestions: number,
    difficulty: QuizDifficulty,
    language: string = DEFAULT_LANGUAGE,
    questionTypes?: QuizQuestionType[]
  ): Promise<GeneratedQuiz> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const preparedText = this.prepareText(text, 120000); // Gemini can handle much more
    const requestedQuestionTypes = this.normalizeQuizQuestionTypes(questionTypes);
    const requestedQuestionTypeSet = new Set<QuizQuestionType>(requestedQuestionTypes);
    const questionTypeLabelMap: Record<QuizQuestionType, string> = {
      MULTIPLE_CHOICE: 'Multiple Choice',
      TRUE_FALSE: 'True/False',
      FILL_IN_THE_BLANK: 'Fill in the Blank',
    };
    const requestedQuestionTypeLabels = requestedQuestionTypes
      .map((type) => questionTypeLabelMap[type])
      .join(', ');

    const targetNumQuestions = Math.min(Math.max(Math.floor(numQuestions) || 10, 1), 40);

    // Estimate question capacity conservatively for source-only generation.
    const estimatedSourceCapacity = Math.max(3, Math.floor(preparedText.length / 260));
    const needsWebAugmentation = estimatedSourceCapacity < targetNumQuestions;

    const difficultyInstructions: Record<QuizDifficulty, string> = {
      EASY: 'Create straightforward questions testing basic recall and understanding of key facts.',
      MEDIUM:
        'Create questions requiring understanding of concepts and ability to apply knowledge.',
      HARD: 'Create challenging questions requiring deep analysis, synthesis, and critical thinking.',
    };

    const maxAttempts = needsWebAugmentation ? 4 : 3;
    let bestQuestions: QuizQuestion[] = [];
    let bestTitle = 'Course Quiz';

    try {
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      const callQuizModel = async (prompt: string, useGoogleSearch: boolean): Promise<string> => {
        try {
          return await this.callGemini(
            prompt,
            3,
            { temperature: 0.9, topP: 0.98 },
            { useGoogleSearch }
          );
        } catch (error: any) {
          const message = String(error?.message || '');
          if (
            useGoogleSearch &&
            /google[_\s-]?search|unknown name "tools"|invalid argument|tool/i.test(message)
          ) {
            logger.warn(
              { error: message },
              'Gemini web grounding unavailable; retrying quiz generation without Google Search tool'
            );
            return this.callGemini(prompt, 3, { temperature: 0.9, topP: 0.98 });
          }
          throw error;
        }
      };

      const normalizeQuestionType = (value: unknown): QuizQuestionType | null => {
        const normalized = String(value || '')
          .trim()
          .toUpperCase()
          .replace(/[\s-]+/g, '_');

        if (
          normalized === 'MULTIPLE_CHOICE' ||
          normalized === 'MCQ' ||
          normalized === 'MULTIPLECHOICE'
        ) {
          return 'MULTIPLE_CHOICE';
        }

        if (
          normalized === 'TRUE_FALSE' ||
          normalized === 'TRUEFALSE' ||
          normalized === 'TF' ||
          normalized === 'BOOLEAN'
        ) {
          return 'TRUE_FALSE';
        }

        if (
          normalized === 'FILL_IN_THE_BLANK' ||
          normalized === 'FILL_BLANK' ||
          normalized === 'FILLINTHEBLANK' ||
          normalized === 'SHORT_ANSWER' ||
          normalized === 'SHORTANSWER' ||
          normalized === 'BLANK'
        ) {
          return 'FILL_IN_THE_BLANK';
        }

        return null;
      };

      const inferQuestionTypeFromShape = (questionText: string, options: string[]): QuizQuestionType => {
        const optionKey = options
          .map((option) => normalizeQuizAnswerText(option))
          .sort()
          .join('|');

        if (options.length === 2 && optionKey === 'false|true') {
          return 'TRUE_FALSE';
        }

        if (options.length === 0 || /\b_{3,}\b/.test(questionText) || /\bblank\b/i.test(questionText)) {
          return 'FILL_IN_THE_BLANK';
        }

        return 'MULTIPLE_CHOICE';
      };

      const normalizeTrueFalseAnswer = (value: unknown): 'True' | 'False' | null => {
        const normalized = normalizeQuizAnswerText(value);
        if (['true', 't', 'yes', 'y', '1'].includes(normalized)) {
          return 'True';
        }
        if (['false', 'f', 'no', 'n', '0'].includes(normalized)) {
          return 'False';
        }
        return null;
      };

      const validateQuestions = (
        rawQuestions: unknown[],
        existingQuestionKeys?: Set<string>
      ): { questions: QuizQuestion[]; rejectedForLengthBias: number; rejectedDuplicateCount: number } => {
        const seenQuestionKeys = new Set(existingQuestionKeys || []);
        let rejectedForLengthBias = 0;
        let rejectedDuplicateCount = 0;

        const questions: QuizQuestion[] = rawQuestions
          .map((question: any) => {
            const questionText = String(question?.question || '').replace(/\s+/g, ' ').trim();
            if (!questionText) {
              return null;
            }

            const questionKey = questionText.toLowerCase();
            if (seenQuestionKeys.has(questionKey)) {
              rejectedDuplicateCount += 1;
              return null;
            }

            const optionCandidates: string[] = (Array.isArray(question?.options)
              ? question.options
              : []
            )
              .map((option: unknown) => String(option || '').replace(/\s+/g, ' ').trim())
              .filter((option: string) => Boolean(option));
            const cleanedOptions: string[] = Array.from(new Set(optionCandidates));

            const explicitQuestionType = normalizeQuestionType(question?.questionType);
            const inferredQuestionType = explicitQuestionType || inferQuestionTypeFromShape(questionText, cleanedOptions);

            if (!requestedQuestionTypeSet.has(inferredQuestionType)) {
              return null;
            }

            const explanation = String(question?.explanation || '').trim();

            if (inferredQuestionType === 'FILL_IN_THE_BLANK') {
              const rawCorrectAnswer =
                question?.correctAnswer ?? question?.answer ?? question?.expectedAnswer ?? '';
              const cleanedCorrectAnswer = String(rawCorrectAnswer || '')
                .replace(/\s+/g, ' ')
                .trim();

              if (!cleanedCorrectAnswer) {
                return null;
              }

              seenQuestionKeys.add(questionKey);

              return {
                questionType: 'FILL_IN_THE_BLANK',
                question: questionText,
                options: [],
                correctAnswer: cleanedCorrectAnswer,
                explanation,
              } as QuizQuestion;
            }

            if (inferredQuestionType === 'TRUE_FALSE') {
              const trueFalseOptions = ['True', 'False'];
              const resolvedTrueFalseAnswer =
                normalizeTrueFalseAnswer(question?.correctAnswer) ||
                normalizeTrueFalseAnswer(resolveQuizCorrectAnswerText(question?.correctAnswer, trueFalseOptions));

              if (!resolvedTrueFalseAnswer) {
                return null;
              }

              seenQuestionKeys.add(questionKey);

              return {
                questionType: 'TRUE_FALSE',
                question: questionText,
                options: this.shuffleArray(trueFalseOptions),
                correctAnswer: resolvedTrueFalseAnswer,
                explanation,
              } as QuizQuestion;
            }

            if (cleanedOptions.length !== 4) {
              return null;
            }

            const resolvedCorrect = resolveQuizCorrectAnswerText(question?.correctAnswer, cleanedOptions);
            const matchedCorrectOption = cleanedOptions.find(
              (option) => normalizeQuizAnswerText(option) === normalizeQuizAnswerText(resolvedCorrect)
            );

            if (!matchedCorrectOption) {
              return null;
            }

            const getWordCount = (value: string): number =>
              value
                .split(/\s+/)
                .map((word) => word.trim())
                .filter(Boolean).length;

            const optionWordCounts = cleanedOptions.map((option) => getWordCount(option));
            const maxOptionWords = Math.max(...optionWordCounts);
            const minOptionWords = Math.min(...optionWordCounts);
            const correctWordCount = getWordCount(matchedCorrectOption);
            const distractorWordCounts = cleanedOptions
              .filter((option) => option !== matchedCorrectOption)
              .map((option) => getWordCount(option));
            const avgDistractorWordCount =
              distractorWordCounts.reduce((sum, count) => sum + count, 0) /
              Math.max(1, distractorWordCounts.length);
            const longestOptionsCount = optionWordCounts.filter(
              (count) => count === maxOptionWords
            ).length;
            const correctIsUniqueLongest =
              longestOptionsCount === 1 && correctWordCount === maxOptionWords;
            const extremeLengthGap = maxOptionWords - minOptionWords >= 9;
            const correctSignificantlyLonger =
              correctWordCount >= avgDistractorWordCount + 5 ||
              correctWordCount >= Math.ceil(avgDistractorWordCount * 1.45);

            if (correctIsUniqueLongest && extremeLengthGap && correctSignificantlyLonger) {
              rejectedForLengthBias += 1;
              return null;
            }

            seenQuestionKeys.add(questionKey);

            return {
              questionType: 'MULTIPLE_CHOICE',
              question: questionText,
              options: this.shuffleArray(cleanedOptions),
              correctAnswer: matchedCorrectOption,
              explanation,
            } as QuizQuestion;
          })
          .filter((question): question is QuizQuestion => question !== null);

        return {
          questions,
          rejectedForLengthBias,
          rejectedDuplicateCount,
        };
      };

      const buildQuizPrompt = (
        questionCount: number,
        attemptNumber: number,
        allowExternalContext: boolean,
        existingQuestions: string[] = []
      ): string => {
        const generationToken = crypto.randomUUID().slice(0, 12);
        const includeMultipleChoice = requestedQuestionTypeSet.has('MULTIPLE_CHOICE');
        const includeTrueFalse = requestedQuestionTypeSet.has('TRUE_FALSE');
        const includeFillInTheBlank = requestedQuestionTypeSet.has('FILL_IN_THE_BLANK');
        const questionTypeRules = [
          includeMultipleChoice
            ? '- MULTIPLE_CHOICE: Use exactly 4 answer options. ONE correct, THREE plausible distractors.'
            : '',
          includeTrueFalse
            ? '- TRUE_FALSE: The `question` text MUST be a single, declarative statement (a fact) that the user must evaluate. NEVER use open-ended questions, and NEVER use phrasing like "Which of the following...". Use exactly two options: "True" and "False".'
            : '',
          includeFillInTheBlank
            ? '- FILL_IN_THE_BLANK: Use no options (empty array). CRITICAL: The `question` text MUST physically contain a blank line "__________" where the missing word belongs. NEVER output a complete sentence without a blank. The exact missing word goes in `correctAnswer`. The correct answer MUST be extremely short (1 to 3 words maximum), ideally a single specific noun, name, date, or core term. You MUST include 2-3 common synonyms separated by a pipe (|) character in the `correctAnswer` field to allow for leniency (e.g. "lengthy|long|extended"). Never obscure long phrases or entire sentences.'
            : '',
        ]
          .filter(Boolean)
          .join('\n');

        const multipleChoiceQualityRules = includeMultipleChoice
          ? `
- Distractor Quality: For MULTIPLE_CHOICE, distractors must be close competitors to the correct answer.
- No Giveaways: For MULTIPLE_CHOICE, avoid wording cues that reveal the answer.
- Option Length: For MULTIPLE_CHOICE, keep options similar in length and detail. CRITICAL: The longest option must NOT always be the correct answer. Intentionally make distractors longer or more detailed than the correct answer on some questions to prevent length-based guessing.
- Length Balance Rule: Keep MULTIPLE_CHOICE options in a tight range (ideally 7-18 words unless naturally numeric/date-based).`
          : '';

        const externalContextInstruction = allowExternalContext
          ? `\nWEB AUGMENTATION MODE:\n- Use the provided text as the primary source.\n- If the text lacks enough details to create ${questionCount} strong questions, supplement with reliable mainstream educational knowledge and current web-grounded facts about the same topic.\n- Keep all added facts tightly aligned to the source topic and avoid niche/trivia-only questions.\n- Never contradict the source text.`
          : '\nSOURCE-ONLY MODE:\n- Build all questions directly from the provided text.';

        const existingQuestionsInstruction =
          existingQuestions.length > 0
            ? `\nDo NOT duplicate or paraphrase these already-generated questions:\n${existingQuestions
                .map((question, index) => `${index + 1}. ${question}`)
                .join('\n')}`
            : '';

        return `${languageInstruction}

You are a Senior Academic Content Specialist with expertise in creating highly accurate, context-aware educational assessments.

You must respond with valid JSON in this exact format:
      {"title": "Quiz Title", "questions": [{"questionType": "MULTIPLE_CHOICE|TRUE_FALSE|FILL_IN_THE_BLANK", "question": "Question text", "options": ["Option A", "Option B"], "correctAnswer": "Exact expected answer text", "explanation": "Why this answer is correct"}]}

      IMPORTANT: The "correctAnswer" field must contain the EXACT expected answer text (not a letter like "A").

      Create a quiz with exactly ${questionCount} questions from the following text.
      Use ONLY these question types: ${requestedQuestionTypeLabels}.
Attempt ${attemptNumber}. Generation token: ${generationToken}.

Difficulty level: ${difficulty}
${difficultyInstructions[difficulty]}
${externalContextInstruction}
${existingQuestionsInstruction}

CRITICAL REQUIREMENTS:
- **Questions**: Professional, clear, unambiguous, and perfectly aligned to the source topic. Ensure questions actually test comprehension, not just trivial recall where possible.
      - **Question Type Rules**:
      ${questionTypeRules}
      - **Misconception-Based Choices**: Use realistic learner mistakes as distractors rather than obviously wrong or absurd options.
      ${multipleChoiceQualityRules}
- **Accuracy**: Verify every question and answer against trustworthy sources and the provided text. Never generate conflicting questions in the same quiz.
- **Explanations**: Provide highly professional, educational, and detailed explanations. Do not just state "This is the answer." You must thoroughly explain *why* it is correct based on core concepts, and briefly clarify why major alternatives are incorrect. Aim for 2-4 comprehensive sentences per explanation.
- **Novelty**: Generate a fresh variant with different question wording and alternative distractor framing from typical prior attempts.
- **Coverage**: Spread questions evenly across different major concepts from the source topic.

Make the quiz exceptionally high quality, strictly formatted, and reflective of the material's core concepts.

Text:
${preparedText}`;
      };

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const useGoogleSearch = needsWebAugmentation || attempt > 2;
        const prompt = buildQuizPrompt(targetNumQuestions, attempt, useGoogleSearch);

        const content = await callQuizModel(prompt, useGoogleSearch);

        // Use safe JSON parsing
        const parsed = this.safeParseJson<GeneratedQuiz>(content);
        const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
        const { questions: validatedQuestions, rejectedForLengthBias, rejectedDuplicateCount } =
          validateQuestions(rawQuestions);

        if (parsed.title) {
          bestTitle = String(parsed.title).trim() || bestTitle;
        }

        if (validatedQuestions.length > bestQuestions.length) {
          bestQuestions = validatedQuestions;
        }

        if (validatedQuestions.length >= targetNumQuestions) {
          return {
            title: bestTitle,
            questions: validatedQuestions.slice(0, targetNumQuestions),
          };
        }

        logger.warn(
          {
            requested: targetNumQuestions,
            received: validatedQuestions.length,
            attempt,
            usedWebGrounding: useGoogleSearch,
            rejectedForLengthBias,
            rejectedDuplicateCount,
          },
          'Quiz generation returned fewer valid questions than requested'
        );
      }

      // Top-up pass: if we are still short, ask for only the missing questions with anti-duplication guidance.
      let mergedQuestions = [...bestQuestions];

      for (let topUpAttempt = 1; topUpAttempt <= 2 && mergedQuestions.length < targetNumQuestions; topUpAttempt += 1) {
        const missingQuestionCount = targetNumQuestions - mergedQuestions.length;
        const existingQuestions = mergedQuestions.map((question) => question.question);
        const topUpPrompt = buildQuizPrompt(
          missingQuestionCount,
          maxAttempts + topUpAttempt,
          true,
          existingQuestions
        );
        const topUpContent = await callQuizModel(topUpPrompt, true);
        const topUpParsed = this.safeParseJson<GeneratedQuiz>(topUpContent);
        const topUpRawQuestions = Array.isArray(topUpParsed.questions) ? topUpParsed.questions : [];
        const existingQuestionKeys = new Set(
          mergedQuestions.map((question) => question.question.toLowerCase())
        );

        const {
          questions: topUpQuestions,
          rejectedForLengthBias,
          rejectedDuplicateCount,
        } = validateQuestions(topUpRawQuestions, existingQuestionKeys);

        if (topUpParsed.title) {
          bestTitle = String(topUpParsed.title).trim() || bestTitle;
        }

        if (topUpQuestions.length > 0) {
          mergedQuestions = [...mergedQuestions, ...topUpQuestions].slice(0, targetNumQuestions);
        }

        logger.warn(
          {
            requested: targetNumQuestions,
            currentlyAvailable: mergedQuestions.length,
            topUpAttempt,
            rejectedForLengthBias,
            rejectedDuplicateCount,
          },
          'Quiz generation top-up attempt completed'
        );
      }

      if (mergedQuestions.length === 0) {
        throw new Error('Failed to generate quiz questions. Please try again.');
      }

      if (mergedQuestions.length < targetNumQuestions) {
        logger.warn(
          {
            requested: targetNumQuestions,
            returned: mergedQuestions.length,
            estimatedSourceCapacity,
            usedWebAugmentation: true,
          },
          'Returning partial quiz because model could not produce the full requested count'
        );
      }

      return {
        title: bestTitle,
        questions: mergedQuestions,
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate quiz');
      throw new Error('Failed to generate quiz. Please try again.');
    }
  }

  async generateQuizImprovementTips(
    input: {
      title?: string;
      difficulty: QuizDifficulty | string;
      score: number;
      totalQuestions: number;
      questions: Array<{
        question: string;
        questionType?: QuizQuestionType | string;
        userAnswer?: string | null;
        correctAnswer: string;
        isCorrect: boolean;
        explanation?: string | null;
      }>;
    },
    language: string = DEFAULT_LANGUAGE
  ): Promise<QuizImprovementTips> {
    const normalizedLanguage = this.normalizeLanguage(language);
    const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);
    const safeTotalQuestions = Math.max(1, Math.floor(input.totalQuestions || 0));
    const safeScore = Math.max(0, Math.floor(input.score || 0));
    const safePercentage = Math.round((safeScore / safeTotalQuestions) * 100);

    const compactQuestionData = input.questions.slice(0, 25).map((question) => ({
      question: String(question.question || '').replace(/\s+/g, ' ').trim(),
      type: String(question.questionType || 'MULTIPLE_CHOICE')
        .trim()
        .toUpperCase(),
      result: question.isCorrect ? 'correct' : 'incorrect',
      userAnswer: String(question.userAnswer || '').replace(/\s+/g, ' ').trim(),
      correctAnswer: String(question.correctAnswer || '').replace(/\s+/g, ' ').trim(),
      explanation: String(question.explanation || '').replace(/\s+/g, ' ').trim(),
    }));

    const prompt = `${languageInstruction}

You are an expert learning coach. Based on a student's quiz attempt, provide practical and encouraging coaching.

You must respond with valid JSON in this exact format:
{"summary":"short overall feedback","strengths":["strength 1"],"improvements":["improvement 1"],"nextSteps":["step 1"]}

Rules:
- Keep the feedback concise and actionable.
- strengths: 2 to 4 bullets.
- improvements: 2 to 4 bullets focused on missed concepts and habits.
- nextSteps: 2 to 4 concrete study actions.
- Do not include markdown, code fences, or extra keys.

Quiz title: ${String(input.title || 'Quiz').trim()}
Difficulty: ${String(input.difficulty || 'MEDIUM').toUpperCase()}
Score: ${safeScore}/${safeTotalQuestions} (${safePercentage}%)

Question-level results:
${JSON.stringify(compactQuestionData, null, 2)}
`;

    try {
      const content = await this.callGemini(prompt, 2, {
        temperature: 0.45,
        topP: 0.9,
        maxOutputTokens: 1200,
      });

      const parsed = this.safeParseJson<QuizImprovementTips>(content, () => ({
        summary: safePercentage >= 70 ? 'You performed well overall. Keep strengthening weak spots.' : 'You are building progress. Focus on missed concepts and retake after review.',
        strengths: ['You completed the quiz and identified what you know well.'],
        improvements: ['Review the questions you missed and compare your answer to the correct one.'],
        nextSteps: ['Take targeted notes on weak topics and retake the quiz within 24 hours.'],
      }));

      const normalizeList = (value: unknown, fallback: string): string[] => {
        const list = Array.isArray(value)
          ? value
              .map((item) => String(item || '').replace(/\s+/g, ' ').trim())
              .filter(Boolean)
              .slice(0, 4)
          : [];
        return list.length > 0 ? list : [fallback];
      };

      return {
        summary:
          String(parsed.summary || '').replace(/\s+/g, ' ').trim() ||
          (safePercentage >= 70
            ? 'You performed well overall. Keep strengthening weak spots.'
            : 'You are building progress. Focus on missed concepts and retake after review.'),
        strengths: normalizeList(
          parsed.strengths,
          'You completed the quiz and identified what you know well.'
        ),
        improvements: normalizeList(
          parsed.improvements,
          'Review missed questions and understand why the correct answer is right.'
        ),
        nextSteps: normalizeList(
          parsed.nextSteps,
          'Retake the quiz after reviewing your weakest topics.'
        ),
      };
    } catch (error: any) {
      logger.warn({ error: error?.message }, 'Failed to generate AI quiz improvement tips');

      return {
        summary:
          safePercentage >= 70
            ? 'Nice work. You have a strong base and can improve with targeted review.'
            : 'You are making progress. A focused review plan will quickly raise your score.',
        strengths: ['You completed the assessment and generated useful performance data.'],
        improvements: ['Revisit the concepts behind the questions you missed.'],
        nextSteps: ['Create a short review list from your missed questions and retake the quiz.'],
      };
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
    const targetNumCards = Math.min(Math.max(Math.floor(numCards) || 20, 10), 50);
    const cacheKey = `flashcards_${normalizedLanguage}_${this.hashText(preparedText)}_${targetNumCards}`;
    const cached = cache.get<GeneratedFlashcards>(cacheKey);

    if (cached && Array.isArray(cached.cards) && cached.cards.length > 0) {
      logger.info('Returning cached flashcards');
      return cached;
    }

    try {
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      const prompt = `${languageInstruction}

You are a Senior Academic Researcher specializing in creating effective study flashcards from educational content.

You must respond with valid JSON in this exact format:
{"title": "Flashcard Set Title", "cards": [{"front": "Question/Concept", "back": "Answer/Explanation"}]}

Create exactly ${targetNumCards} high-quality flashcards from the following text. Each flashcard should:
- **Front**: A clear, specific question, term, or concept. Keep it short and punchy.
- **Back**: A clear, accurate, and easy-to-read explanation.
  - Use bullet points if the answer has multiple parts.
  - Keep it focused on the core concept.
- **Variety**: Cover definitions, key concepts, cause-and-effect relationships, and major facts.
- **Study Guide Handling**: If source text is a study guide/review sheet, create cards about the underlying concepts, not about the guide's instructions or worksheet structure.

IMPORTANT: Verify all facts against the provided source material. Ensure the content is easy to read on a card.

Text:
${preparedText}`;

      let bestResult = this.buildFallbackFlashcards(preparedText, targetNumCards);

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const content = await this.callGemini(prompt, 3, { temperature: 0.8, topP: 0.97 });

        // Use safe JSON parsing with fallback
        const parsed = this.safeParseJson<GeneratedFlashcards>(content, (rawText) => {
          const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim();
          return {
            title: 'Study Flashcards',
            cards: [{ front: 'Key Concept', back: cleaned.slice(0, 900) }],
          };
        });

        const normalized = this.normalizeGeneratedFlashcards(parsed, targetNumCards, preparedText);
        if (normalized.cards.length > bestResult.cards.length) {
          bestResult = normalized;
        }

        if (normalized.cards.length >= targetNumCards) {
          bestResult = normalized;
          break;
        }

        logger.warn(
          {
            requested: targetNumCards,
            received: normalized.cards.length,
            attempt,
          },
          'Flashcard generation returned fewer cards than requested'
        );
      }

      cache.set(cacheKey, bestResult);
      return bestResult;
    } catch (error: any) {
      const fallback = this.buildFallbackFlashcards(preparedText, targetNumCards);
      if (fallback.cards.length > 0) {
        logger.warn(
          { error: error.message, fallbackCards: fallback.cards.length },
          'Gemini flashcard generation failed; using deterministic fallback cards'
        );
        cache.set(cacheKey, fallback);
        return fallback;
      }

      logger.error({ error: error.message }, 'Failed to generate flashcards');
      throw new Error('Failed to generate flashcards. Please try again.');
    }
  }

  private normalizeGeneratedFlashcards(
    raw: unknown,
    targetNumCards: number,
    sourceText: string
  ): GeneratedFlashcards {
    const parsed =
      raw && typeof raw === 'object' ? (raw as Partial<GeneratedFlashcards>) : ({} as Partial<GeneratedFlashcards>);
    const rawCards: unknown[] = Array.isArray(parsed.cards) ? parsed.cards : [];
    const seen = new Set<string>();

    const cards: Flashcard[] = rawCards
      .map((card) => this.normalizeFlashcard(card))
      .filter((card): card is Flashcard => {
        if (!card) {
          return false;
        }

        const key = `${card.front.toLowerCase()}__${card.back.toLowerCase()}`;
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, targetNumCards);

    const titleCandidate = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const title = titleCandidate || 'Study Flashcards';

    if (cards.length >= targetNumCards) {
      return { title, cards };
    }

    const fallbackSet = this.buildFallbackFlashcards(sourceText, targetNumCards);

    if (cards.length === 0) {
      return fallbackSet;
    }

    const mergedCards = [...cards];
    for (const fallbackCard of fallbackSet.cards) {
      if (mergedCards.length >= targetNumCards) {
        break;
      }

      const key = `${fallbackCard.front.toLowerCase()}__${fallbackCard.back.toLowerCase()}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      mergedCards.push(fallbackCard);
    }

    return {
      title,
      cards: mergedCards,
    };
  }

  private normalizeFlashcard(card: unknown): Flashcard | null {
    if (!card || typeof card !== 'object') {
      return null;
    }

    const candidate = card as Record<string, unknown>;
    const frontRaw =
      candidate.front ??
      candidate.question ??
      candidate.prompt ??
      candidate.term ??
      candidate.concept;
    const backRaw =
      candidate.back ??
      candidate.answer ??
      candidate.response ??
      candidate.definition ??
      candidate.explanation;

    const front = String(frontRaw ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    const back = String(backRaw ?? '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!front || !back) {
      return null;
    }

    return {
      front: this.truncateText(front, 220),
      back: this.truncateText(back, 900),
    };
  }

  private buildFallbackFlashcards(sourceText: string, targetNumCards: number): GeneratedFlashcards {
    const normalizedSource = sourceText.replace(/\r/g, '\n').trim();
    const sentencePool = normalizedSource
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((segment) => segment.replace(/\s+/g, ' ').trim())
      .filter((segment) => segment.length >= 35);

    const cards: Flashcard[] = [];
    const seen = new Set<string>();

    for (const sentence of sentencePool) {
      if (cards.length >= targetNumCards) {
        break;
      }

      const conceptSeed = sentence.split(/[:;,-]/)[0].trim();
      const promptSeed = conceptSeed.length >= 12 ? conceptSeed : sentence.slice(0, 72).trim();
      const front = this.truncateText(`Explain: ${promptSeed.replace(/[.?!]$/, '')}`, 140);
      const back = this.truncateText(sentence, 900);
      const key = `${front.toLowerCase()}__${back.toLowerCase()}`;

      if (!back || seen.has(key)) {
        continue;
      }

      seen.add(key);
      cards.push({ front, back });
    }

    if (cards.length === 0 && normalizedSource) {
      const firstChunk = normalizedSource.replace(/\s+/g, ' ').slice(0, 900).trim();
      cards.push({
        front: 'What is the main idea of this material?',
        back: firstChunk || 'No readable content was available for fallback flashcard generation.',
      });
    }

    return {
      title: 'Study Flashcards',
      cards: cards.slice(0, targetNumCards),
    };
  }

  /**
   * Generate custom content based on a provided prompt
   * Used for game generation and other flexible AI tasks
   */
  async generateCustomContent(
    prompt: string,
    options?: { disableCache?: boolean }
  ): Promise<string> {
    const disableCache = Boolean(options?.disableCache);
    const cacheKey = `custom_${this.hashText(prompt)}`;
    const cached = disableCache ? null : cache.get<string>(cacheKey);

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

      if (!disableCache) {
        cache.set(cacheKey, content);
      }

      logger.info(
        {
          promptLength: sanitizedPrompt.length,
          responseLength: content.length,
          cacheBypassed: disableCache,
        },
        'Custom content generated successfully'
      );

      return content;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate custom content');
      throw new Error(error.message || 'Failed to generate custom content');
    }
  }

  /**
   * Generate transcript metadata from uploaded audio.
   */
  async generateFromAudio(
    audioBase64: string,
    mimeType: string,
    language: string = DEFAULT_LANGUAGE
  ): Promise<{ transcript: string; summary: string; title: string; keyConcepts: string[] }> {
    try {
      const normalizedAudioBase64 = String(audioBase64 || '').replace(/\s+/g, '');
      if (!normalizedAudioBase64) {
        throw new Error('Audio payload is empty. Please try recording again.');
      }

      const normalizedMimeType = String(mimeType || '').toLowerCase().trim() || 'audio/webm';
      const normalizedLanguage = this.normalizeLanguage(language);
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      if (!this.authClient) {
        this.authClient = await this.auth.getClient();
      }

      const tokenResponse = await this.authClient.getAccessToken();
      if (!tokenResponse.token) {
        throw new Error('Failed to obtain access token for Gemini API');
      }

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMimeType,
                  data: normalizedAudioBase64,
                },
              },
              {
                text: `${languageInstruction}

You are an expert lecture transcription assistant.

You must respond with valid JSON in this exact format:
{"transcript":"full transcript text","summary":"2-4 sentence summary","title":"short lecture title","keyConcepts":["concept 1","concept 2"]}

Rules:
- transcript: include the full spoken transcript as plain text without timestamps.
- summary: concise and study-focused.
- title: short, descriptive lecture title.
- keyConcepts: 3 to 8 concise study concepts.
- If some words are unclear, transcribe best effort and keep going.
`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.9,
          maxOutputTokens: 16384,
        },
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenResponse.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as any;
      const modelText =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: any) => String(part?.text || '').trim())
          .filter(Boolean)
          .join('\n') || '';

      if (!modelText) {
        throw new Error('Empty audio transcription response from Gemini API');
      }

      const parsed = this.safeParseJson<{
        transcript?: string;
        summary?: string;
        title?: string;
        keyConcepts?: string[];
      }>(modelText, (rawText) => {
        const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim();
        return {
          transcript: cleaned,
          summary: '',
          title: 'Recorded Lecture',
          keyConcepts: [],
        };
      });

      const transcript = String(parsed.transcript || '')
        .replace(/\s+/g, ' ')
        .trim();
      const summary = String(parsed.summary || '')
        .replace(/\s+/g, ' ')
        .trim();
      const title =
        String(parsed.title || 'Recorded Lecture')
          .replace(/\s+/g, ' ')
          .trim() || 'Recorded Lecture';
      const keyConcepts = Array.isArray(parsed.keyConcepts)
        ? parsed.keyConcepts
            .map((concept) => String(concept || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .slice(0, 8)
        : [];

      if (!transcript) {
        throw new Error('Gemini did not return a usable transcript for this recording.');
      }

      return {
        transcript,
        summary,
        title,
        keyConcepts,
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate content from audio');
      throw new Error(error.message || 'Failed to process audio content');
    }
  }

  /**
   * OCR text extraction for uploaded images.
   */
  async extractTextFromImage(
    imageBase64: string,
    mimeType: string,
    language: string = DEFAULT_LANGUAGE
  ): Promise<string> {
    try {
      const normalizedImageBase64 = String(imageBase64 || '').replace(/\s+/g, '');
      if (!normalizedImageBase64) {
        throw new Error('Image payload is empty.');
      }

      const normalizedMimeType = String(mimeType || '').toLowerCase().trim() || 'image/png';
      const normalizedLanguage = this.normalizeLanguage(language);
      const languageInstruction = this.buildLanguageInstruction(normalizedLanguage);

      if (!this.authClient) {
        this.authClient = await this.auth.getClient();
      }

      const tokenResponse = await this.authClient.getAccessToken();
      if (!tokenResponse.token) {
        throw new Error('Failed to obtain access token for Gemini API');
      }

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMimeType,
                  data: normalizedImageBase64,
                },
              },
              {
                text: `${languageInstruction}

You are an OCR assistant for study documents.

Extract all visible, readable text from this image.
Rules:
- Return plain text only.
- Preserve logical line breaks.
- Do not include markdown or JSON.
- If no readable text is present, return exactly: [NO_TEXT_DETECTED]`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          topK: 32,
          topP: 0.9,
          maxOutputTokens: 16384,
        },
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenResponse.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as any;
      const modelText =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: any) => String(part?.text || '').trim())
          .filter(Boolean)
          .join('\n') || '';

      const cleanedText = modelText
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/```/g, '')
        .trim();

      if (!cleanedText || cleanedText === '[NO_TEXT_DETECTED]') {
        return '';
      }

      return cleanedText;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to extract text from image');
      throw new Error(error.message || 'Failed to extract text from image');
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
   * Create a stable hash from full text for cache keys.
   * Using the full prompt avoids collisions when different prompts share long prefixes.
   */
  private hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 32);
  }

  private normalizeQuizQuestionTypes(questionTypes?: QuizQuestionType[] | string[]): QuizQuestionType[] {
    const supportedQuestionTypes: QuizQuestionType[] = [
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
      'FILL_IN_THE_BLANK',
    ];

    if (!Array.isArray(questionTypes) || questionTypes.length === 0) {
      return supportedQuestionTypes;
    }

    const mapped = questionTypes
      .map((questionType) =>
        String(questionType || '')
          .trim()
          .toUpperCase()
          .replace(/[\s-]+/g, '_')
      )
      .map((questionType): QuizQuestionType | null => {
        if (
          questionType === 'MULTIPLE_CHOICE' ||
          questionType === 'MCQ' ||
          questionType === 'MULTIPLECHOICE'
        ) {
          return 'MULTIPLE_CHOICE';
        }

        if (
          questionType === 'TRUE_FALSE' ||
          questionType === 'TRUEFALSE' ||
          questionType === 'TF' ||
          questionType === 'BOOLEAN'
        ) {
          return 'TRUE_FALSE';
        }

        if (
          questionType === 'FILL_IN_THE_BLANK' ||
          questionType === 'FILL_BLANK' ||
          questionType === 'FILLINTHEBLANK' ||
          questionType === 'SHORT_ANSWER' ||
          questionType === 'SHORTANSWER' ||
          questionType === 'BLANK'
        ) {
          return 'FILL_IN_THE_BLANK';
        }

        return null;
      })
      .filter((questionType): questionType is QuizQuestionType => questionType !== null);

    const deduped = Array.from(new Set(mapped));
    return deduped.length > 0 ? deduped : supportedQuestionTypes;
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
