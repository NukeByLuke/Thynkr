export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function ensureUniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  let slug = slugify(base);
  if (!slug) {
    slug = 'course';
  }

  let attempt = 0;
  let candidate = slug;
  while (await exists(candidate)) {
    attempt += 1;
    candidate = `${slug}-${attempt}`;
  }

  return candidate;
}
