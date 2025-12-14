/**
 * Text Chunking Utility for TTS
 * Intelligently splits long text into smaller chunks for faster audio generation
 */

/**
 * Split text into sentences, respecting sentence boundaries
 */
function splitIntoSentences(text: string): string[] {
  // Match sentence endings: . ! ? or newlines
  // Keep the punctuation with the sentence
  const sentenceRegex = /[^.!?\n]+[.!?\n]+/g;
  const sentences = text.match(sentenceRegex) || [];

  // Handle case where text doesn't end with punctuation
  const lastMatch = sentences.join('');
  if (lastMatch.length < text.length) {
    const remainder = text.slice(lastMatch.length).trim();
    if (remainder) {
      sentences.push(remainder);
    }
  }

  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Chunk text into segments suitable for TTS API calls
 * 
 * @param text - The text to chunk
 * @param maxLength - Maximum length per chunk (default: 250 characters)
 * @returns Array of text chunks, each under maxLength
 * 
 * @example
 * const text = "Hello world. This is a test. Another sentence here.";
 * const chunks = chunkText(text, 30);
 * // Returns: ["Hello world. This is a test.", "Another sentence here."]
 */
export function chunkText(text: string, maxLength: number = 250): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Normalize whitespace
  const normalizedText = text.trim().replace(/\s+/g, ' ');

  // If text is already under maxLength, return as single chunk
  if (normalizedText.length <= maxLength) {
    return [normalizedText];
  }

  // Split into sentences
  const sentences = splitIntoSentences(normalizedText);

  // Combine sentences into chunks
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // If a single sentence exceeds maxLength, split it by words
    if (sentence.length > maxLength) {
      // Save current chunk if not empty
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Split long sentence by words
      const words = sentence.split(/\s+/);
      let wordChunk = '';

      for (const word of words) {
        // If a single word exceeds maxLength, add it as its own chunk
        if (word.length > maxLength) {
          if (wordChunk.trim()) {
            chunks.push(wordChunk.trim());
          }
          chunks.push(word);
          wordChunk = '';
          continue;
        }

        const testChunk = wordChunk ? `${wordChunk} ${word}` : word;
        if (testChunk.length <= maxLength) {
          wordChunk = testChunk;
        } else {
          chunks.push(wordChunk.trim());
          wordChunk = word;
        }
      }

      if (wordChunk.trim()) {
        chunks.push(wordChunk.trim());
      }
      continue;
    }

    // Try adding sentence to current chunk
    const testChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;

    if (testChunk.length <= maxLength) {
      currentChunk = testChunk;
    } else {
      // Current chunk is full, save it and start new chunk
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Calculate estimated TTS duration for text
 * Assumes ~150 words per minute average speaking rate
 * 
 * @param text - The text to estimate
 * @returns Estimated duration in seconds
 */
export function estimateTTSDuration(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  const wordsPerMinute = 150;
  return Math.ceil((wordCount / wordsPerMinute) * 60);
}
