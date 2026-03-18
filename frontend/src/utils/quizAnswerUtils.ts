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

  if (normalizedSelected === normalizeText(resolvedCorrect)) {
    return true;
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
