/**
 * File Processor Service
 * Extracts text content from various document formats (PDF, DOCX, TXT, PPTX).
 */

import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { logger } from '../lib/logger';

/**
 * FileProcessorService - Handles text extraction from uploaded documents
 */
export class FileProcessorService {
  /**
   * Extract text from a file based on its type
   */
  async extractText(filePath: string, mimeType: string): Promise<string> {
    const normalizedMime = (mimeType || '').toLowerCase();
    const extension = path.extname(filePath || '').toLowerCase();

    try {
      if (normalizedMime === 'application/pdf' || extension === '.pdf') {
        return await this.extractFromPDF(filePath);
      }

      if (
        normalizedMime ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        normalizedMime === 'application/msword' ||
        extension === '.docx' ||
        extension === '.doc'
      ) {
        return await this.extractFromDOCX(filePath);
      }

      if (normalizedMime === 'text/plain' || extension === '.txt') {
        return await this.extractFromTXT(filePath);
      }

      const isOpenXmlPresentation = extension === '.pptx' || extension === '.ppsx';
      const isLegacyPresentation = extension === '.ppt' || extension === '.pps';

      if (
        normalizedMime ===
          'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        normalizedMime ===
          'application/vnd.openxmlformats-officedocument.presentationml.slideshow' ||
        normalizedMime === 'application/vnd.ms-powerpoint' ||
        isOpenXmlPresentation
      ) {
        if (isLegacyPresentation) {
          throw new Error('Legacy PowerPoint files (.ppt/.pps) are not supported yet');
        }

        return await this.extractFromPPTX(filePath);
      }

      throw new Error(`Unsupported file type: ${mimeType || extension}`);
    } catch (error: any) {
      logger.error({ error, filePath, mimeType }, 'Failed to extract text from file');
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractFromPDF(filePath: string): Promise<string> {
    // Dynamic import for ESM-compatible module
    const { PDFParse } = await import('pdf-parse');
    const dataBuffer = await fs.readFile(filePath);

    const pdfParse = new PDFParse({
      verbosity: 0,
      data: dataBuffer,
    });

    const result = await pdfParse.getText();

    if (!result.text || result.text.trim().length === 0) {
      throw new Error('No text could be extracted from PDF');
    }

    return result.text;
  }

  /**
   * Extract text from DOCX file
   */
  private async extractFromDOCX(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });

    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text could be extracted from DOCX');
    }

    return result.value;
  }

  /**
   * Extract text from TXT file
   */
  private async extractFromTXT(filePath: string): Promise<string> {
    const text = await fs.readFile(filePath, 'utf-8');

    if (!text || text.trim().length === 0) {
      throw new Error('Text file is empty');
    }

    return text;
  }

  private async extractFromPPTX(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(fileBuffer);
    const slideFileNames = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      trimValues: true,
    });
    const collectedText: string[] = [];

    for (const slideName of slideFileNames) {
      const slideFile = zip.file(slideName);
      if (!slideFile) {
        continue;
      }

      const slideXml = await slideFile.async('string');
      const slideData = parser.parse(slideXml);
      this.collectPresentationText(slideData, collectedText);
    }

    const normalizedText = collectedText
      .map((fragment) => fragment.trim())
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!normalizedText) {
      throw new Error('No text could be extracted from presentation');
    }

    return normalizedText;
  }

  private collectPresentationText(node: unknown, chunks: string[]): void {
    if (!node) {
      return;
    }

    if (typeof node === 'string') {
      chunks.push(node);
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        this.collectPresentationText(item, chunks);
      }
      return;
    }

    if (typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('@')) {
          continue;
        }

        if (key === 'a:t') {
          this.collectPresentationText(value, chunks);
          continue;
        }

        if (key === '#text') {
          this.collectPresentationText(value, chunks);
          continue;
        }

        this.collectPresentationText(value, chunks);
      }
    }
  }
  /**
   * Validate file type
   */
  validateFileType(mimeType: string, originalName: string): boolean {
    const normalizedMime = (mimeType || '').toLowerCase();
    const lowerOriginal = originalName ? originalName.toLowerCase().trim() : '';
    const lastDot = lowerOriginal.lastIndexOf('.');
    const extension = lastDot >= 0 ? lowerOriginal.slice(lastDot) : '';

    const allowedMimeTypes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      'text/plain',
      'application/octet-stream',
    ]);

    const allowedExtensions = new Set([
      '.pdf',
      '.docx',
      '.doc',
      '.txt',
      '.ppt',
      '.pptx',
      '.pps',
      '.ppsx',
    ]);

    return allowedMimeTypes.has(normalizedMime) || allowedExtensions.has(extension);
  }

  supportsTextExtraction(mimeType: string, originalName: string): boolean {
    const normalizedMime = (mimeType || '').toLowerCase();
    const lowerOriginal = originalName ? originalName.toLowerCase().trim() : '';
    const lastDot = lowerOriginal.lastIndexOf('.');
    const extension = lastDot >= 0 ? lowerOriginal.slice(lastDot) : '';

    const extractableMimeTypes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      'text/plain',
    ]);

    const extractableExtensions = new Set(['.pdf', '.docx', '.doc', '.txt', '.pptx', '.ppsx']);

    return extractableMimeTypes.has(normalizedMime) || extractableExtensions.has(extension);
  }
}
