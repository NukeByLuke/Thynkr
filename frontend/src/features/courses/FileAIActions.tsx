import { useState } from 'react';
import { FileText, BookOpen, HelpCircle, Layers, Sparkles, Loader2 } from 'lucide-react';

interface FileAIActionsProps {
  fileId: string;
  fileName: string;
  fileType: string;
  onAction: (action: 'summary' | 'notes' | 'quiz' | 'flashcards') => void;
  loading?: boolean;
  disabled?: boolean;
}

// Supported file types for AI features
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

function isAICompatible(fileType: string): boolean {
  return SUPPORTED_FILE_TYPES.includes(fileType) || fileType.startsWith('text/');
}

export default function FileAIActions({
  fileId: _fileId,
  fileName: _fileName,
  fileType,
  onAction,
  loading = false,
  disabled = false,
}: FileAIActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isCompatible = isAICompatible(fileType);

  const actions = [
    {
      id: 'summary' as const,
      label: 'Summarize',
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    },
    {
      id: 'notes' as const,
      label: 'Notes',
      icon: BookOpen,
      color: 'text-green-500',
      bgColor: 'hover:bg-green-50 dark:hover:bg-green-900/20',
    },
    {
      id: 'quiz' as const,
      label: 'Quiz',
      icon: HelpCircle,
      color: 'text-purple-500',
      bgColor: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
    },
    {
      id: 'flashcards' as const,
      label: 'Flashcards',
      icon: Layers,
      color: 'text-orange-500',
      bgColor: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
    },
  ];

  const handleAction = (action: 'summary' | 'notes' | 'quiz' | 'flashcards') => {
    setShowMenu(false);
    onAction(action);
  };

  if (!isCompatible) {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
          title="AI features not available for this file type"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || loading}
        className={`p-2 rounded-lg transition-colors ${
          loading
            ? 'text-primary-500 animate-pulse'
            : 'text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="AI Actions"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      </button>

      {showMenu && !loading && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px] overflow-hidden">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${action.bgColor} transition-colors`}
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                <span className="text-gray-700 dark:text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
