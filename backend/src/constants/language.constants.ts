export const SUPPORTED_LANGUAGES = [
  // Major Languages
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'pt-br', label: 'Portuguese (Brazil)' },
  { code: 'pt-pt', label: 'Portuguese (Portugal)' },
  
  // Asian Languages
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'zh-cn', label: 'Chinese (Simplified)' },
  { code: 'zh-tw', label: 'Chinese (Traditional)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'th', label: 'Thai' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ms', label: 'Malay' },
  { code: 'hi', label: 'Hindi' },
  { code: 'pa', label: 'Punjabi' },
  
  // Middle Eastern Languages
  { code: 'ar', label: 'Arabic' },
  { code: 'he', label: 'Hebrew' },
  { code: 'tr', label: 'Turkish' },
  
  // Eastern European Languages
  { code: 'ru', label: 'Russian' },
  { code: 'pl', label: 'Polish' },
  { code: 'cs', label: 'Czech' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'ro', label: 'Romanian' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'bg', label: 'Bulgarian' },
  
  // Nordic Languages
  { code: 'sv', label: 'Swedish' },
  { code: 'no', label: 'Norwegian' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  
  // Western European Languages
  { code: 'nl', label: 'Dutch' },
  { code: 'el', label: 'Greek' },
  
  // Other Languages
  { code: 'ca', label: 'Catalan' },
  { code: 'sk', label: 'Slovak' },
  { code: 'hr', label: 'Croatian' },
  { code: 'sr', label: 'Serbian' },
];

export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((lang) => lang.code));
