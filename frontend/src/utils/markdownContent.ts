function decodeCommonHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");
}

function convertHtmlLikeContentToMarkdown(value: string): string {
  let normalized = decodeCommonHtmlEntities(value);

  // Headings first so nested formatting can still be normalized afterward.
  for (let level = 1; level <= 6; level += 1) {
    const headingPattern = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, 'gi');
    normalized = normalized.replace(headingPattern, (_match, inner) => {
      return `\n${'#'.repeat(level)} ${String(inner).trim()}\n\n`;
    });
  }

  normalized = normalized
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li[^>]*>\s*/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<blockquote[^>]*>/gi, '\n> ')
    .replace(/<\/blockquote>/gi, '\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    // Remove any remaining unsupported tags while preserving their inner text.
    .replace(/<[^>]+>/g, '');

  return normalized;
}

export function normalizeStudyMarkdown(content: string): string {
  const safeContent = String(content ?? '');
  const escapedLineBreaks = (safeContent.match(/\\n/g) || []).length;
  const actualLineBreaks = (safeContent.match(/\n/g) || []).length;

  const withNormalizedLineBreaks =
    escapedLineBreaks > actualLineBreaks ? safeContent.replace(/\\n/g, '\n') : safeContent;

  const containsHtmlLikeTags = /<\/?(h[1-6]|p|ul|ol|li|strong|b|em|i|blockquote|br|code)\b/i.test(
    withNormalizedLineBreaks
  );

  const normalizedBase = containsHtmlLikeTags
    ? convertHtmlLikeContentToMarkdown(withNormalizedLineBreaks)
    : decodeCommonHtmlEntities(withNormalizedLineBreaks);

  return normalizedBase
    .replace(/\r/g, '')
    .replace(/(^|\n)H([1-6])\s*:\s*(.+)/gm, (_m, p1, lvl, txt) => {
      return `${p1}${'#'.repeat(Number(lvl))} ${String(txt).trim()}`;
    })
    .replace(/(^|\n)\s*H([1-6])\s+(.+)/gm, (_m, p1, lvl, txt) => {
      return `${p1}${'#'.repeat(Number(lvl))} ${String(txt).trim()}`;
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
