export interface QuizQuestionLike {
  correctAnswer?: string | null;
  options?: Array<string | null | undefined>;
}

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const normalizeFreeText = (value: unknown): string =>
  normalizeText(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeBooleanAnswer = (value: unknown): 'true' | 'false' | null => {
  const normalized = normalizeText(value);

  if (['true', 't', 'yes', 'y', '1'].includes(normalized)) {
    return 'true';
  }

  if (['false', 'f', 'no', 'n', '0'].includes(normalized)) {
    return 'false';
  }

  return null;
};

const calculateLevenshteinDistance = (a: string, b: string): number => {
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
};

const cleanOptions = (options?: Array<string | null | undefined>): string[] =>
  (options ?? []).map((option) => String(option ?? '').trim()).filter(Boolean);

const parseOptionIndex = (value: unknown, optionCount: number): number | null => {
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
};

const stripLeadingOptionToken = (value: string): string =>
  value
    .replace(/^(?:OPTION\s*)?\(?[A-Z]\)?[.):-]\s*/i, '')
    .replace(/^\(?[0-9]+\)?[.):-]\s*/, '')
    .trim();

export const resolveCorrectAnswerText = (question: QuizQuestionLike): string => {
  const options = cleanOptions(question.options);
  const rawCorrect = String(question.correctAnswer ?? '').trim();

  if (!rawCorrect) {
    return options[0] ?? '';
  }

  const indexedAnswer = parseOptionIndex(rawCorrect, options.length);
  if (indexedAnswer !== null && options[indexedAnswer]) {
    return options[indexedAnswer];
  }

  const normalizedCorrect = normalizeText(rawCorrect);
  const directOptionMatch = options.find((option) => normalizeText(option) === normalizedCorrect);
  if (directOptionMatch) {
    return directOptionMatch;
  }

  const strippedCorrect = stripLeadingOptionToken(rawCorrect);
  if (strippedCorrect) {
    const normalizedStripped = normalizeText(strippedCorrect);
    const strippedOptionMatch = options.find((option) => normalizeText(option) === normalizedStripped);
    if (strippedOptionMatch) {
      return strippedOptionMatch;
    }
  }

  return rawCorrect;
};

export const isQuizAnswerCorrect = (selectedAnswer: unknown, question: QuizQuestionLike): boolean => {
  const options = cleanOptions(question.options);
  const resolvedCorrect = resolveCorrectAnswerText(question);
  const normalizedSelected = normalizeText(selectedAnswer);

  if (!normalizedSelected) {
    return false;
  }

  if (normalizeText(normalizedSelected) === normalizeText(resolvedCorrect.split('|')[0])) {
    return true;
  }

  // Free-text/blank-style answers: compare normalized text and boolean equivalents.
  if (options.length <= 1) {
    const acceptableAnswers = resolvedCorrect.split('|');

    for (const acceptableAnswer of acceptableAnswers) {
      const selectedBoolean = normalizeBooleanAnswer(selectedAnswer);
      const correctBoolean = normalizeBooleanAnswer(acceptableAnswer);

      if (selectedBoolean && correctBoolean && selectedBoolean === correctBoolean) {
        return true;
      }

      const normalizedSelectedFreeText = normalizeFreeText(selectedAnswer);
      const normalizedCorrectFreeText = normalizeFreeText(acceptableAnswer);

      if (normalizedSelectedFreeText && normalizedCorrectFreeText) {
        if (normalizedSelectedFreeText === normalizedCorrectFreeText) {
          return true;
        }

        // Check substring inclusion for answers >= 4 chars long
        // Examples: Correct "George Washington", Selected "Washington"
        // or Correct "Photosynthesis", Selected "Photosynthesis process"
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

  const selectedIndex = parseOptionIndex(selectedAnswer, options.length);
  if (selectedIndex !== null && options[selectedIndex]) {
    if (normalizeText(options[selectedIndex]) === normalizeText(resolvedCorrect)) {
      return true;
    }
  }

  const correctIndex = parseOptionIndex(question.correctAnswer ?? '', options.length);
  if (correctIndex !== null) {
    if (selectedIndex !== null && selectedIndex === correctIndex) {
      return true;
    }

    if (options[correctIndex] && normalizedSelected === normalizeText(options[correctIndex])) {
      return true;
    }
  }

  return false;
};

export const calculateQuizScore = <T extends QuizQuestionLike>(
  questions: T[],
  getSelectedAnswer: (question: T, index: number) => unknown
): number => {
  let score = 0;

  questions.forEach((question, index) => {
    if (isQuizAnswerCorrect(getSelectedAnswer(question, index), question)) {
      score += 1;
    }
  });

  return score;
};
