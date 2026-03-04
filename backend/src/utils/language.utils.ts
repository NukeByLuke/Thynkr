import prisma from '../db/client';
import { DEFAULT_LANGUAGE } from '../constants/language.constants';

export async function resolveUserLanguage(userId?: string | null): Promise<string> {
  if (!userId) {
    return DEFAULT_LANGUAGE;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLanguage: true },
  });

  return user?.preferredLanguage || DEFAULT_LANGUAGE;
}

export function normalizeFileForLanguage(file: any) {
  if (!file) {
    return null;
  }

  const { summaries, notes, userId, filePath, ...rest } = file;
  const isExternalSource = typeof filePath === 'string' && /^https?:\/\//i.test(filePath);

  return {
    ...rest,
    summary: summaries?.[0] ?? null,
    notes: notes?.[0] ?? null,
    downloadUrl: !isExternalSource && file.fileName ? `/uploads/${file.fileName}` : null,
    sourceUrl: isExternalSource ? filePath : null,
  };
}
