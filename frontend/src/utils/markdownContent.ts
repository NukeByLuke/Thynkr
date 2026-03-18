export function normalizeStudyMarkdown(content: string): string {
  const safeContent = String(content ?? '');
  const escapedLineBreaks = (safeContent.match(/\\n/g) || []).length;
  const actualLineBreaks = (safeContent.match(/\n/g) || []).length;

  const withNormalizedLineBreaks =
    escapedLineBreaks > actualLineBreaks ? safeContent.replace(/\\n/g, '\n') : safeContent;

  return withNormalizedLineBreaks
    .replace(/\r/g, '')
    .replace(/(^|\n)H([1-6])\s*:\s*(.+)/gm, (_m, p1, lvl, txt) => {
      return `${p1}${'#'.repeat(Number(lvl))} ${String(txt).trim()}`;
    })
    .replace(/(^|\n)\s*H([1-6])\s+(.+)/gm, (_m, p1, lvl, txt) => {
      return `${p1}${'#'.repeat(Number(lvl))} ${String(txt).trim()}`;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
