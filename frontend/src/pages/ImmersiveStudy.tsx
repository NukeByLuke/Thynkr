/**
 * ImmersiveStudy Page - Zen Mode Study Interface
 * 
 * A highly polished, distraction-free study experience following the Aurora design system.
 * Features glassmorphism, smooth animations, and keyboard navigation.
 * 
 * CRITICAL: Layout context management ensures sidebar ALWAYS reappears on navigation away.
 */

import { useEffect, useCallback, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Layers, 
  Brain,
  Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import SummaryView from '@/features/study/SummaryView';
import NotesView from '@/features/study/NotesView';
import FlashcardViewer from '@/features/study/FlashcardViewer';
import QuizPlayer from '@/features/study/QuizPlayer';
import GenerationModal from '@/components/modals/GenerationModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Hooks & Context
import { useStudySession } from '@/hooks/useStudySession';
import { useLayout } from '@/contexts/LayoutContext';
import api from '@/lib/api';

// Types
interface UploadedFile {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  extractedText?: string;
  summary?: { id: string; content: string };
  notes?: { id: string; keyPoints: string[]; detailed: string };
  quizzes?: Array<{
    id: string;
    title: string;
    difficulty: string;
    questions: any[];
  }>;
  flashcardSets?: Array<{
    id: string;
    title: string;
    cards: any[];
  }>;
}

type TabType = 'summary' | 'notes' | 'flashcards' | 'quizzes';

// Tab configuration with icons
const TABS: { id: TabType; label: string; shortLabel: string; icon: typeof BookOpen }[] = [
  { id: 'summary', label: 'Summary', shortLabel: 'Summary', icon: BookOpen },
  { id: 'notes', label: 'Notes', shortLabel: 'Notes', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', shortLabel: 'Cards', icon: Layers },
  { id: 'quizzes', label: 'Quiz', shortLabel: 'Quiz', icon: Brain },
];

// Animation variants
const contentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function ImmersiveStudy() {
  const navigate = useNavigate();
  const { fileId } = useParams<{ fileId: string }>();
  const { setHideSidebar, setCustomHeaderContent } = useLayout();

  // Early redirect if no fileId
  if (!fileId) {
    return <Navigate to="/study" replace />;
  }

  const getToken = () => localStorage.getItem('accessToken');

  // Use the unified study session hook
  const {
    selectedFile,
    activeTab,
    selectedFlashcardSet,
    numCards,
    setSelectedFile,
    setActiveTab,
    setSelectedFlashcardSet,
    setNumCards,
    generateSummaryMutation,
    generateNotesMutation,
    generateFlashcardsMutation,
    generateQuizMutation,
    selectedQuiz,
  } = useStudySession({ queryKey: ['study-files'] });

  // Fetch uploaded files
  const { data: filesData, isLoading } = useQuery({
    queryKey: ['study-files'],
    queryFn: async () => {
      const response = await api.get('/study/files');
      return response.data;
    },
    enabled: !!getToken(),
  });

  const files: UploadedFile[] = filesData?.files || [];

  // Auto-select file from URL parameter
  useEffect(() => {
    if (fileId && files.length > 0) {
      const file = files.find((f) => f.id === fileId);
      if (file && file.id !== selectedFile?.id) {
        setSelectedFile(file);
      } else if (!file) {
        toast.error('File not found');
        navigate('/study', { replace: true });
      }
    }
  }, [fileId, files, selectedFile?.id, setSelectedFile, navigate]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL: Zen Mode Layout Management
  // useLayoutEffect ensures synchronous cleanup BEFORE React commits any other changes
  // Empty deps array ensures this ONLY runs on mount/unmount, not on re-renders
  // ═══════════════════════════════════════════════════════════════════════════
  useLayoutEffect(() => {
    // Enter Zen Mode - hide sidebar
    setHideSidebar(true);

    // CRITICAL: Exit Zen Mode on unmount - synchronous cleanup prevents race conditions
    return () => {
      setHideSidebar(false);
      setCustomHeaderContent(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - MUST only run on mount/unmount

  // Handle tab navigation
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSelectedFlashcardSet(null);
  }, [setActiveTab, setSelectedFlashcardSet]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentIndex = TABS.findIndex(t => t.id === activeTab);

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        handleTabChange(TABS[currentIndex - 1].id);
      } else if (e.key === 'ArrowRight' && currentIndex < TABS.length - 1) {
        e.preventDefault();
        handleTabChange(TABS[currentIndex + 1].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/study');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleTabChange, navigate]);

  // Custom header content
  useEffect(() => {
    if (!fileId || !selectedFile) return;

    setCustomHeaderContent(
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left: Back button */}
        <motion.button
          onClick={() => navigate('/study')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </motion.button>

        {/* Center: File title with Zen badge */}
        <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-full">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">Zen Mode</span>
          </div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs lg:max-w-md">
            {selectedFile.originalName}
          </h2>
        </div>

        {/* Right: Tab Pills */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.shortLabel}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );

    return () => setCustomHeaderContent(null);
  }, [fileId, selectedFile, activeTab, handleTabChange, navigate, setCustomHeaderContent]);

  // Determine active generation type
  const getActiveGenerationType = (): 'summary' | 'notes' | 'flashcards' | 'quiz' | null => {
    if (generateSummaryMutation.isPending) return 'summary';
    if (generateNotesMutation.isPending) return 'notes';
    if (generateFlashcardsMutation.isPending) return 'flashcards';
    if (generateQuizMutation.isPending) return 'quiz';
    return null;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render Tab Content
  // ═══════════════════════════════════════════════════════════════════════════
  const renderTabContent = () => {
    if (!selectedFile || selectedFile.status !== 'COMPLETED') {
      return (
        <EmptyState
          icon={FileText}
          title="Processing..."
          description="This file is still being processed. Please wait a moment."
        />
      );
    }

    switch (activeTab) {
      case 'summary':
        if (selectedFile.summary) {
          return (
            <SummaryView
              content={selectedFile.summary.content}
              onRegenerate={() => generateSummaryMutation.mutate({ fileId: selectedFile.id, regenerate: true })}
              isRegenerating={generateSummaryMutation.isPending}
            />
          );
        }
        return (
          <GeneratePrompt
            type="summary"
            onGenerate={() => generateSummaryMutation.mutate({ fileId: selectedFile.id })}
            isGenerating={generateSummaryMutation.isPending}
          />
        );

      case 'notes':
        if (selectedFile.notes) {
          return (
            <NotesView
              keyPoints={selectedFile.notes.keyPoints}
              detailed={selectedFile.notes.detailed}
              onRegenerate={() => generateNotesMutation.mutate({ fileId: selectedFile.id, regenerate: true })}
              isRegenerating={generateNotesMutation.isPending}
            />
          );
        }
        return (
          <GeneratePrompt
            type="notes"
            onGenerate={() => generateNotesMutation.mutate({ fileId: selectedFile.id })}
            isGenerating={generateNotesMutation.isPending}
          />
        );

      case 'flashcards':
        if (selectedFlashcardSet || (selectedFile.flashcardSets && selectedFile.flashcardSets.length > 0)) {
          const set = selectedFlashcardSet || selectedFile.flashcardSets![0];
          return <FlashcardViewer cards={set.cards} title={set.title} />;
        }
        return (
          <GeneratePrompt
            type="flashcards"
            onGenerate={() => generateFlashcardsMutation.mutate({ fileId: selectedFile.id, numCards })}
            isGenerating={generateFlashcardsMutation.isPending}
            extraContent={
              <div className="max-w-xs mx-auto mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Number of cards: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{numCards}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={numCards}
                  onChange={(e) => setNumCards(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>10</span>
                  <span>50</span>
                </div>
              </div>
            }
          />
        );

      case 'quizzes':
        return (
          <QuizPlayer
            quizId={selectedQuiz?.id || 'temp-quiz'}
            title={selectedFile.originalName}
            questions={selectedQuiz?.questions || []}
            fileId={selectedFile.id}
            onGenerateQuiz={(difficulty: string, numQuestions: number) => {
              generateQuizMutation.mutate({
                fileId: selectedFile.id,
                difficulty: difficulty.toUpperCase(),
                numQuestions,
              });
            }}
            isGenerating={generateQuizMutation.isPending}
            onSubmit={async (answers, timeSpentSeconds, questionTimings) => {
              if (selectedQuiz?.id) {
                try {
                  const response = await api.post(`/study/quizzes/${selectedQuiz.id}/submit`, {
                    answers,
                    timeSpentSeconds,
                    questionTimings,
                  });

                  // Dispatch achievement notifications
                  if (response.data.achievements?.length > 0) {
                    window.dispatchEvent(new CustomEvent('api-notification', {
                      detail: { notifications: response.data.achievements }
                    }));
                  }

                  if (response.data.xpGained > 0) {
                    toast.success(`+${response.data.xpGained} XP earned!`);
                  }

                  return response.data;
                } catch (error: any) {
                  toast.error(error.response?.data?.error || 'Failed to submit quiz');
                  throw error;
                }
              }

              // Fallback: Calculate score locally
              const questions = selectedQuiz?.questions || [];
              let score = 0;
              questions.forEach((q: any) => {
                if (answers[q.id] === q.correctAnswer) score++;
              });
              return {
                score,
                total: questions.length,
                percentage: questions.length > 0 ? Math.round((score / questions.length) * 100) : 0,
              };
            }}
          />
        );

      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Loading States
  // ═══════════════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner fullScreen />
      </div>
    );
  }

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading file...</p>
        </motion.div>
      </div>
    );
  }

  const activeGenerationType = getActiveGenerationType();

  // ═══════════════════════════════════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Generation Modal */}
      <GenerationModal
        isOpen={activeGenerationType !== null}
        type={activeGenerationType || 'summary'}
      />

      {/* Main Content */}
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Content Container with Glass Effect */}
          <motion.div
            layout
            className="relative rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/30 overflow-hidden"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Keyboard Hints */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="hidden lg:flex items-center justify-center gap-4 mt-6 text-xs text-slate-500 dark:text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">→</kbd>
              <span>Switch tabs</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">Esc</kbd>
              <span>Exit</span>
            </span>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  icon: typeof FileText;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center"
      >
        <Icon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </motion.div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

interface GeneratePromptProps {
  type: 'summary' | 'notes' | 'flashcards';
  onGenerate: () => void;
  isGenerating: boolean;
  extraContent?: React.ReactNode;
}

function GeneratePrompt({ type, onGenerate, isGenerating, extraContent }: GeneratePromptProps) {
  const labels = {
    summary: { title: 'No summary yet', button: 'Generate Summary', icon: BookOpen },
    notes: { title: 'No notes yet', button: 'Generate Notes', icon: FileText },
    flashcards: { title: 'No flashcards yet', button: 'Generate Flashcards', icon: Layers },
  };

  const config = labels[type];
  const Icon = config.icon;

  return (
    <div className="text-center py-16">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center"
      >
        <Icon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
      </motion.div>
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{config.title}</h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-8">
        Let AI analyze your content and generate helpful study materials.
      </p>

      {extraContent}

      <motion.button
        onClick={onGenerate}
        disabled={isGenerating}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
            Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {config.button}
          </span>
        )}
      </motion.button>
    </div>
  );
}
