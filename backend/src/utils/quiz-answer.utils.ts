const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function normalizeQuizAnswerText(value: unknown): string {
  return String(value ?? '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeFreeTextAnswer(value: unknown): string {
  return normalizeQuizAnswerText(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeBooleanAnswer(value: unknown): 'true' | 'false' | null {
  const normalized = normalizeQuizAnswerText(value);

  if (['true', 't', 'yes', 'y', '1'].includes(normalized)) {
    return 'true';
  }

  if (['false', 'f', 'no', 'n', '0'].includes(normalized)) {
    return 'false';
  }

  return null;
}

function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        (matrix[i][j - 1] as number) + 1,
        (matrix[i - 1][j] as number) + 1,
        (matrix[i - 1][j - 1] as number) + indicator
      );
    }
  }
  return matrix[a.length][b.length] as number;
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

  if (normalizedSelected === normalizeQuizAnswerText(resolvedCorrect.split('|')[0])) {
    return true;
  }

  // Free-text and blank-style answers: compare with punctuation-insensitive normalization.
  if (safeOptions.length <= 1) {
    const acceptableAnswers = resolvedCorrect.split('|');

    for (const acceptableAnswer of acceptableAnswers) {
      const normalizedSelectedBoolean = normalizeBooleanAnswer(selectedAnswer);
      const normalizedCorrectBoolean = normalizeBooleanAnswer(acceptableAnswer);

      if (
        normalizedSelectedBoolean &&
        normalizedCorrectBoolean &&
        normalizedSelectedBoolean === normalizedCorrectBoolean
      ) {
        return true;
      }

      const normalizedSelectedFreeText = normalizeFreeTextAnswer(selectedAnswer);
      const normalizedCorrectFreeText = normalizeFreeTextAnswer(acceptableAnswer);

      if (normalizedSelectedFreeText && normalizedCorrectFreeText) {
        if (normalizedSelectedFreeText === normalizedCorrectFreeText) {
          return true;
        }

        // Check substring inclusion for answers >= 4 chars long
        if (
          normalizedSelectedFreeText.length >= 4 &&
          normalizedCorrectFreeText.length >= 4
        ) {
          if (
            normalizedCorrectFreeText.includes(normalizedSelectedFreeText) ||
            normalizedSelectedFreeText.includes(normalizedCorrectFreeText)
          ) {
            return true;
          }
        }

        // Check typo tolerance based on Levenshtein distance
        const distance = calculateLevenshteinDistance(normalizedSelectedFreeText, normalizedCorrectFreeText);
        const isShortAnswer = Math.max(normalizedSelectedFreeText.length, normalizedCorrectFreeText.length) <= 10;
        
        // Allow 1 typo for words up to 10 chars, 2 typos for longer words
        const allowedTypos = isShortAnswer ? 1 : 2;
        
        if (distance <= allowedTypos) {
          return true;
        }
      }
    }
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
