export interface Language {
  value: string;
  label: string;
  flag: string;
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
