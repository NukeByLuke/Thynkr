export interface Language {
  value: string;
  label: string;
  flag: string;
}

export function getCountryCodeFromFlag(flag: string): string | null {
  const chars = Array.from(flag);
  if (chars.length !== 2) return null;

  const codePoints = chars.map((char) => char.codePointAt(0));
  if (codePoints.some((cp) => cp === undefined)) return null;

  const normalized = codePoints as number[];
  const isRegionalIndicator = normalized.every((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff);
  if (!isRegionalIndicator) return null;

  const countryCode = normalized
    .map((cp) => String.fromCharCode(cp - 0x1f1e6 + 65))
    .join('');

  return countryCode;
}

export function getFlagImageUrl(flag: string, width = 24): string | null {
  const countryCode = getCountryCodeFromFlag(flag);
  if (!countryCode) return null;
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  // Major Languages
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { value: 'pt-PT', label: 'Portuguese (Portugal)', flag: '🇵🇹' },
  
  // Asian Languages
  { value: 'zh-CN', label: 'Chinese (Simplified)', flag: '🇨🇳' },
  { value: 'zh-TW', label: 'Chinese (Traditional)', flag: '🇹🇼' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
  { value: 'th', label: 'Thai', flag: '🇹🇭' },
  { value: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { value: 'ms', label: 'Malay', flag: '🇲🇾' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'pa', label: 'Punjabi', flag: '🇮🇳' },
  
  // Middle Eastern Languages
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { value: 'he', label: 'Hebrew', flag: '🇮🇱' },
  { value: 'tr', label: 'Turkish', flag: '🇹🇷' },
  
  // Eastern European Languages
  { value: 'ru', label: 'Russian', flag: '🇷🇺' },
  { value: 'pl', label: 'Polish', flag: '🇵🇱' },
  { value: 'cs', label: 'Czech', flag: '🇨🇿' },
  { value: 'hu', label: 'Hungarian', flag: '🇭🇺' },
  { value: 'ro', label: 'Romanian', flag: '🇷🇴' },
  { value: 'uk', label: 'Ukrainian', flag: '🇺🇦' },
  { value: 'bg', label: 'Bulgarian', flag: '🇧🇬' },
  
  // Nordic Languages
  { value: 'sv', label: 'Swedish', flag: '🇸🇪' },
  { value: 'no', label: 'Norwegian', flag: '🇳🇴' },
  { value: 'da', label: 'Danish', flag: '🇩🇰' },
  { value: 'fi', label: 'Finnish', flag: '🇫🇮' },
  
  // Western European Languages
  { value: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { value: 'el', label: 'Greek', flag: '🇬🇷' },
  
  // Other Languages
  { value: 'ca', label: 'Catalan', flag: '🇪🇸' },
  { value: 'sk', label: 'Slovak', flag: '🇸🇰' },
  { value: 'hr', label: 'Croatian', flag: '🇭🇷' },
  { value: 'sr', label: 'Serbian', flag: '🇷🇸' },
];
