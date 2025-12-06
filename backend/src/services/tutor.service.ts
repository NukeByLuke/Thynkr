/**
 * AI Tutor Service
 * Provides intelligent tutoring using OpenAI GPT models with context from user's study materials.
 */

import OpenAI from 'openai';
import { logger } from '../lib/logger';
import { DEFAULT_LANGUAGE } from '../constants/language.constants';

export interface TutorMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SourceReference {
  fileId: string;
  fileName: string;
  excerpt: string;
  relevance: number;
}

export interface TutorResponse {
  content: string;
  sources?: SourceReference[];
}

/**
 * Service for AI Tutor chat functionality
 */
export class TutorService {
  private openai: OpenAI;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'dummy' || apiKey.startsWith('sk_test')) {
      logger.warn(
        'OPENAI_API_KEY is not configured or is a placeholder. AI Tutor will not function.'
      );
      // Create a dummy client - will fail on actual API calls
      this.openai = new OpenAI({ apiKey: 'dummy' });
      this.isConfigured = false;
    } else {
      logger.info('OpenAI API configured for AI Tutor');
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
    }
  }

  /**
   * Check if the service is properly configured
   */
  checkConfiguration(): void {
    if (!this.isConfigured) {
      throw new Error('AI Tutor is not configured. Please contact support.');
    }
  }

  /**
   * Build context from user's uploaded files
   */
  buildContext(
    files: { id: string; originalName: string; extractedText: string | null }[]
  ): string {
    if (files.length === 0) {
      return '';
    }

    let context = 'The student has the following study materials:\n\n';

    files.forEach((file, index) => {
      if (file.extractedText) {
        const truncatedText = this.truncateText(file.extractedText, 4000);
        context += `[Document ${index + 1}: "${file.originalName}" (ID: ${file.id})]\n`;
        context += truncatedText;
        context += '\n\n---\n\n';
      }
    });

    return context;
  }

  /**
   * Find relevant source excerpts from files based on the question
   */
  findRelevantSources(
    question: string,
    files: { id: string; originalName: string; extractedText: string | null }[]
  ): SourceReference[] {
    const sources: SourceReference[] = [];
    const questionWords = question
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    files.forEach((file) => {
      if (!file.extractedText) return;

      const text = file.extractedText;
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);

      sentences.forEach((sentence) => {
        const sentenceLower = sentence.toLowerCase();
        const matchCount = questionWords.filter((word) => sentenceLower.includes(word)).length;
        const relevance = matchCount / questionWords.length;

        if (relevance >= 0.3) {
          sources.push({
            fileId: file.id,
            fileName: file.originalName,
            excerpt: sentence.trim().substring(0, 200) + (sentence.length > 200 ? '...' : ''),
            relevance,
          });
        }
      });
    });

    // Sort by relevance and take top 3
    return sources.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
  }

  /**
   * Generate a streaming response from the AI tutor
   */
  async *streamChat(
    messages: TutorMessage[],
    files: { id: string; originalName: string; extractedText: string | null }[],
    language: string = DEFAULT_LANGUAGE
  ): AsyncGenerator<string> {
    // Verify configuration before making API calls
    this.checkConfiguration();

    const context = this.buildContext(files);

    const systemPrompt = `You are an expert AI tutor helping a student understand their course materials. Your role is to:

1. Answer questions clearly and accurately based on the provided study materials
2. Explain complex concepts in simple terms
3. Provide examples and analogies when helpful
4. Encourage deeper understanding by asking follow-up questions
5. Reference specific parts of the study materials when relevant (mention the document name)
6. If information is not in the materials, say so clearly

${context ? `Here is the student's study material for context:\n\n${context}` : 'No study materials have been provided yet.'}

Respond in ${language}. Be helpful, encouraging, and pedagogical. When referencing information from the materials, indicate which document it comes from.`;

    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    logger.info(
      { model, messageCount: messages.length, filesCount: files.length },
      'Starting tutor chat stream'
    );

    try {
      const stream = await this.openai.chat.completions.create({
        model,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      logger.info('Tutor chat stream completed successfully');
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          status: error.status,
          code: error.code,
          type: error.type,
        },
        'Failed to stream tutor response'
      );

      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.status === 401) {
        throw new Error('AI service authentication failed. Please contact support.');
      } else if (error.status === 503 || error.code === 'ETIMEDOUT') {
        throw new Error('AI service is temporarily unavailable. Please try again.');
      } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
        throw new Error('Network error connecting to AI service. Please check your connection.');
      }

      throw new Error('Failed to generate response. Please try again.');
    }
  }

  /**
   * Generate a non-streaming response (for fallback)
   */
  async chat(
    messages: TutorMessage[],
    files: { id: string; originalName: string; extractedText: string | null }[],
    language: string = DEFAULT_LANGUAGE
  ): Promise<TutorResponse> {
    const context = this.buildContext(files);
    const sources =
      messages.length > 0
        ? this.findRelevantSources(messages[messages.length - 1].content, files)
        : [];

    const systemPrompt = `You are an expert AI tutor helping a student understand their course materials. Your role is to:

1. Answer questions clearly and accurately based on the provided study materials
2. Explain complex concepts in simple terms
3. Provide examples and analogies when helpful
4. Encourage deeper understanding by asking follow-up questions
5. Reference specific parts of the study materials when relevant (mention the document name)
6. If information is not in the materials, say so clearly

${context ? `Here is the student's study material for context:\n\n${context}` : 'No study materials have been provided yet.'}

Respond in ${language}. Be helpful, encouraging, and pedagogical.`;

    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content || '';

      return {
        content,
        sources: sources.length > 0 ? sources : undefined,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate tutor response');
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Truncate text to a maximum length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '... [content truncated]';
  }
}
