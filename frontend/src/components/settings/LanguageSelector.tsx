import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, ChevronDown, Search } from 'lucide-react';
import { SUPPORTED_LANGUAGES, Language } from '@/data/languages';
import api from '@/lib/api';

interface LanguageSelectorProps {
  value: string;
  onChange?: (languageCode: string) => void;
  onUpdate?: () => Promise<void>;
}

export default function LanguageSelector({ value, onChange, onUpdate }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Find the currently selected language
  const selectedLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.value === value) || SUPPORTED_LANGUAGES[0];

  // Filter languages based on search query
  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) =>
    lang.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update language mutation
  const updateLanguageMutation = useMutation({
    mutationFn: async (languageCode: string) => {
      const response = await api.patch('/users/me', {
        preferredLanguage: languageCode,
      });
      return response.data;
    },
    onSuccess: async (_, languageCode) => {
      const language = SUPPORTED_LANGUAGES.find((lang) => lang.value === languageCode);
      toast.success(`Study language updated to ${language?.label || languageCode}.`);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // Refetch user to update AuthContext state
      if (onUpdate) {
        await onUpdate();
      }
      setIsOpen(false);
      setSearchQuery('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update language');
    },
  });

  // Handle language selection
  const handleSelect = (language: Language) => {
    if (onChange) {
      onChange(language.value);
    }
    updateLanguageMutation.mutate(language.value);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={updateLanguageMutation.isPending}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedLanguage.flag}</span>
          <span className="font-medium">{selectedLanguage.label}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Language List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => {
                const isSelected = language.value === selectedLanguage.value;
                return (
                  <button
                    key={language.value}
                    onClick={() => handleSelect(language)}
                    disabled={updateLanguageMutation.isPending}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{language.flag}</span>
                      <span className="font-medium">{language.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">No languages found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
