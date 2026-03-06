const DEFAULT_TTS_MAX_CHARS = 4096;

function truncateAtSentenceBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const truncated = text.slice(0, maxChars);
  const sentenceBreak = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('\n')
  );

  if (sentenceBreak > maxChars * 0.6) {
    return truncated.slice(0, sentenceBreak + 1).trim();
  }

  return truncated.trim();
}

export function sanitizeTextForTTS(rawText: string, maxChars = DEFAULT_TTS_MAX_CHARS): string {
  const cleaned = String(rawText || '')
    // Remove fenced code wrappers but keep code content readable
    .replace(/```([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    // Convert links/images into readable text
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Strip markdown structure characters
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\*\*|__|\*|_/g, '')
    .replace(/\|/g, ' ')
    // Strip residual HTML
    .replace(/<[^>]+>/g, ' ')
    // Decode the most common entities that appear in AI output
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  return truncateAtSentenceBoundary(cleaned, maxChars);
}
