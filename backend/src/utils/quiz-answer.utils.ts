const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function normalizeQuizAnswerText(value: unknown): string {
  return String(value ?? '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function coerceOptions(options: unknown[] | undefined): string[] {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option) => String(option ?? '').trim()).filter(Boolean);
}

export function parseQuizAnswerIndex(value: unknown, optionCount: number): number | null {
  if (optionCount <= 0) {
    return null;
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.toUpperCase();
  const compact = normalized.replace(/\s+/g, '');

  const directLetter = compact.match(/^\(?([A-Z])\)?[.):-]?$/);
  if (directLetter) {
    const letterIndex = OPTION_LETTERS.indexOf(directLetter[1]);
    if (letterIndex >= 0 && letterIndex < optionCount) {
      return letterIndex;
    }
  }

  const optionLetter = compact.match(/^OPTION([A-Z])$/);
  if (optionLetter) {
    const letterIndex = OPTION_LETTERS.indexOf(optionLetter[1]);
    if (letterIndex >= 0 && letterIndex < optionCount) {
      return letterIndex;
    }
  }

  const prefixedLetter = normalized.match(/^(?:OPTION\s*)?\(?([A-Z])\)?[.):-]\s+/);
  if (prefixedLetter) {
    const letterIndex = OPTION_LETTERS.indexOf(prefixedLetter[1]);
    if (letterIndex >= 0 && letterIndex < optionCount) {
      return letterIndex;
    }
  }

  const directNumber = compact.match(/^\d+$/);
  if (directNumber) {
    const numeric = Number.parseInt(directNumber[0], 10);
    if (!Number.isNaN(numeric)) {
      if (numeric >= 1 && numeric <= optionCount) {
        return numeric - 1;
      }
      if (numeric >= 0 && numeric < optionCount) {
        return numeric;
      }
    }
  }

  const prefixedNumber = normalized.match(/^\(?([0-9]+)\)?[.):-]\s+/);
  if (prefixedNumber) {
    const numeric = Number.parseInt(prefixedNumber[1], 10);
    if (!Number.isNaN(numeric)) {
      if (numeric >= 1 && numeric <= optionCount) {
        return numeric - 1;
      }
      if (numeric >= 0 && numeric < optionCount) {
        return numeric;
      }
    }
  }

  return null;
}

function stripLeadingOptionToken(value: string): string {
  return value
    .replace(/^(?:OPTION\s*)?\(?[A-Z]\)?[.):-]\s*/i, '')
    .replace(/^\(?[0-9]+\)?[.):-]\s*/, '')
    .trim();
}

export function resolveQuizCorrectAnswerText(correctAnswer: unknown, options?: unknown[]): string {
  const safeOptions = coerceOptions(options);
  const rawCorrect = String(correctAnswer ?? '').trim();

  if (!rawCorrect) {
    return safeOptions[0] ?? '';
  }

  const indexedAnswer = parseQuizAnswerIndex(rawCorrect, safeOptions.length);
  if (indexedAnswer !== null && safeOptions[indexedAnswer]) {
    return safeOptions[indexedAnswer];
  }

  const normalizedCorrect = normalizeQuizAnswerText(rawCorrect);
  const directOptionMatch = safeOptions.find(
    (option) => normalizeQuizAnswerText(option) === normalizedCorrect
  );
  if (directOptionMatch) {
    return directOptionMatch;
  }

  const strippedCorrect = stripLeadingOptionToken(rawCorrect);
  if (strippedCorrect) {
    const normalizedStripped = normalizeQuizAnswerText(strippedCorrect);
    const strippedOptionMatch = safeOptions.find(
      (option) => normalizeQuizAnswerText(option) === normalizedStripped
    );
    if (strippedOptionMatch) {
      return strippedOptionMatch;
    }
  }

  return rawCorrect;
}

export function isQuizAnswerCorrect(
  selectedAnswer: unknown,
  correctAnswer: unknown,
  options?: unknown[]
): boolean {
  const safeOptions = coerceOptions(options);
  const resolvedCorrect = resolveQuizCorrectAnswerText(correctAnswer, safeOptions);
  const normalizedSelected = normalizeQuizAnswerText(selectedAnswer);

  if (!normalizedSelected) {
    return false;
  }

  if (normalizedSelected === normalizeQuizAnswerText(resolvedCorrect)) {
    return true;
  }

  const selectedIndex = parseQuizAnswerIndex(selectedAnswer, safeOptions.length);
  if (selectedIndex !== null && safeOptions[selectedIndex]) {
    if (normalizeQuizAnswerText(safeOptions[selectedIndex]) === normalizeQuizAnswerText(resolvedCorrect)) {
      return true;
    }
  }

  const correctIndex = parseQuizAnswerIndex(correctAnswer, safeOptions.length);
  if (correctIndex !== null) {
    if (selectedIndex !== null && selectedIndex === correctIndex) {
      return true;
    }

    if (safeOptions[correctIndex] && normalizedSelected === normalizeQuizAnswerText(safeOptions[correctIndex])) {
      return true;
    }
  }

  return false;
}
