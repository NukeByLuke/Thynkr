/**
 * ImmersiveStudy Page - Zen Mode Study Interface
 * 
 * A highly polished, distraction-free study experience following the Aurora design system.
 * Features glassmorphism, smooth animations, and keyboard navigation.
 * 
 * CRITICAL: Layout context management ensures sidebar ALWAYS reappears on navigation away.
 */

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Layers, 
  Brain,
  Sparkles,
  SendHorizontal,
  ExternalLink,
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Clock3,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import SummaryView from '@/features/study/SummaryView';
import NotesView from '@/features/study/NotesView';
import FlashcardViewer from '@/features/study/FlashcardViewer';
import QuizPlayer from '@/features/study/QuizPlayer';
import GenerationModal from '@/components/modals/GenerationModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GenerationLoader from '@/components/ui/GenerationLoader';

// Hooks & Context
import { useStudySession } from '@/hooks/useStudySession';
import { useLayout } from '@/contexts/LayoutContext';
import api from '@/lib/api';

// Types
interface UploadedFile {
  id: string;
  fileName?: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  downloadUrl?: string | null;
  sourceUrl?: string | null;
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

type TabType = 'original' | 'summary' | 'notes' | 'flashcards' | 'quizzes';

interface TutorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

function createTutorMessageId() {
  return `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Tab configuration with icons
const TABS: { id: TabType; label: string; shortLabel: string; icon: typeof BookOpen }[] = [
  { id: 'original', label: 'Original Content', shortLabel: 'Original', icon: FileText },
  { id: 'summary', label: 'Summary', shortLabel: 'Summary', icon: BookOpen },
  { id: 'notes', label: 'Notes', shortLabel: 'Notes', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', shortLabel: 'Cards', icon: Layers },
  { id: 'quizzes', label: 'Quiz', shortLabel: 'Quiz', icon: Brain },
];

export default function ImmersiveStudy() {
  const navigate = useNavigate();
  const { fileId } = useParams<{ fileId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setHideSidebar } = useLayout();

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

  const [isTutorActive, setIsTutorActive] = useState(false);
  const [isTutorTyping, setIsTutorTyping] = useState(false);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [tutorMessages, setTutorMessages] = useState<TutorChatMessage[]>([
    {
      id: createTutorMessageId(),
      role: 'assistant',
      content: 'Welcome! I can help break this file down, explain concepts, and quiz your understanding. What should we tackle first?',
      createdAt: new Date().toISOString(),
    },
  ]);
  const tutorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const tutorEndRef = useRef<HTMLDivElement | null>(null);

  const resizeTutorTextarea = useCallback(() => {
    const textarea = tutorTextareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

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
        // File not found, just redirect
        navigate('/study', { replace: true });
      }
    }
  }, [fileId, files, selectedFile?.id, setSelectedFile, navigate]);

  useEffect(() => {
    setHideSidebar(false);
  }, [setHideSidebar]);

  useEffect(() => {
    setIsTutorActive(searchParams.get('tab') === 'tutor');
  }, [searchParams]);

  useEffect(() => {
    if (!selectedFile?.id) return;

    setTutorError(null);
    setTutorInput('');
    setIsTutorTyping(false);
    setTutorMessages([
      {
        id: createTutorMessageId(),
        role: 'assistant',
        content: `You’re studying ${selectedFile.originalName}. Ask me to explain concepts, build memory hooks, or test your understanding.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [selectedFile?.id, selectedFile?.originalName]);

  useEffect(() => {
    resizeTutorTextarea();
  }, [tutorInput, resizeTutorTextarea]);

  useEffect(() => {
    if (!isTutorActive) return;
    tutorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isTutorActive, tutorMessages, isTutorTyping]);

  // Handle tab navigation
  const handleTabChange = useCallback((tab: TabType) => {
    setIsTutorActive(false);
    if (searchParams.get('tab') === 'tutor') {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    }
    setActiveTab(tab);
    setSelectedFlashcardSet(null);
  }, [searchParams, setActiveTab, setSearchParams, setSelectedFlashcardSet]);

  const handleTutorEntry = useCallback(() => {
    setIsTutorActive(true);
    if (searchParams.get('tab') !== 'tutor') {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'tutor');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleTutorSend = useCallback(async () => {
    if (!selectedFile?.id || isTutorTyping) {
      return;
    }

    const trimmedInput = tutorInput.trim();
    if (!trimmedInput) {
      return;
    }

    const history = tutorMessages.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const userMessage: TutorChatMessage = {
      id: createTutorMessageId(),
      role: 'user',
      content: trimmedInput,
      createdAt: new Date().toISOString(),
    };

    setTutorMessages((prev) => [...prev, userMessage]);
    setTutorInput('');
    setTutorError(null);
    setIsTutorTyping(true);

    try {
      let response: any = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          response = await api.post(`/study/files/${selectedFile.id}/tutor`, {
            message: trimmedInput,
            history,
          });
          break;
        } catch (requestError: any) {
          const status = requestError?.response?.status;
          const isRetryable = status === 429 || status >= 500 || !status;
          const shouldRetry = attempt === 0 && isRetryable;

          if (!shouldRetry) {
            throw requestError;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 650));
        }
      }

      const assistantContent =
        response.data?.answer?.trim() ||
        'I had trouble generating a response for that message. Please try rephrasing your question.';

      setTutorMessages((prev) => [
        ...prev,
        {
          id: createTutorMessageId(),
          role: 'assistant',
          content: assistantContent,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Unable to reach AI Tutor right now.';
      setTutorError(errorMessage);
      setTutorMessages((prev) => [
        ...prev,
        {
          id: createTutorMessageId(),
          role: 'assistant',
          content: `I hit an issue: ${errorMessage}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTutorTyping(false);
    }
  }, [isTutorTyping, selectedFile?.id, tutorInput, tutorMessages]);

  // Keyboard navigation (A/D for tabs, arrow keys reserved for flashcards)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isTutorActive) {
        return;
      }

      const currentIndex = TABS.findIndex(t => t.id === activeTab);
      const key = e.key.toLowerCase();

      if (key === 'a' && currentIndex > 0) {
        e.preventDefault();
        handleTabChange(TABS[currentIndex - 1].id);
      } else if (key === 'd' && currentIndex < TABS.length - 1) {
        e.preventDefault();
        handleTabChange(TABS[currentIndex + 1].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Navigate to study page and trigger refresh
        window.location.href = '/study';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleTabChange, isTutorActive, navigate]);

  // Stable quiz submit handler to prevent recreation on each render
  const handleQuizSubmit = useCallback(async (
    answers: Record<string, string>, 
    timeSpentSeconds?: number, 
    questionTimings?: Record<string, number>
  ) => {
    if (selectedQuiz?.id) {
      try {
        const response = await api.post(`/study/quizzes/${selectedQuiz.id}/submit`, {
          answers,
          timeSpentSeconds,
          questionTimings,
        });
        return response.data;
      } catch (error: any) {
        // Let QuizPlayer handle the error with inline UI
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
  }, [selectedQuiz]);

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
      case 'original':
        return <OriginalContentPreview file={selectedFile} />;

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
            onSubmit={handleQuizSubmit}
          />
        );

      default:
        return null;
    }
  };

  const renderTutorChat = () => {
    if (!selectedFile || selectedFile.status !== 'COMPLETED') {
      return (
        <EmptyState
          icon={Sparkles}
          title="Tutor is almost ready"
          description="Your file is still processing. Once complete, AI Tutor will be available instantly."
        />
      );
    }

    return (
      <div className="flex min-h-[62vh] max-h-[72vh] flex-col bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.12),transparent_35%),radial-gradient(circle_at_80%_100%,rgba(6,182,212,0.12),transparent_38%)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_35%),radial-gradient(circle_at_80%_100%,rgba(6,182,212,0.18),transparent_38%)]">
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 space-y-4">
          {tutorMessages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start pl-1 sm:pl-2'}`}
            >
              {message.role === 'assistant' && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-fuchsia-500/80 to-cyan-500/80 text-white flex items-center justify-center shadow-md shadow-fuchsia-500/30">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-gradient-to-br from-pink-600 to-fuchsia-600 dark:from-cyan-500 dark:to-violet-500 text-white shadow-fuchsia-500/30'
                    : 'rounded-bl-md bg-white/95 dark:bg-slate-900/90 border border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200'
                }`}
              >
                {message.content}
              </div>

              {message.role === 'user' && (
                <div className="h-7 w-7 rounded-full bg-slate-900 dark:bg-slate-100 text-[10px] font-semibold text-white dark:text-slate-900 flex items-center justify-center">
                  You
                </div>
              )}
            </div>
          ))}

          {isTutorTyping && (
            <div className="flex items-end gap-2.5 justify-start pl-1 sm:pl-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-fuchsia-500/80 to-cyan-500/80 text-white flex items-center justify-center shadow-md shadow-fuchsia-500/30">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl rounded-bl-md bg-white/95 dark:bg-slate-900/90 border border-slate-200/70 dark:border-white/10 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 dark:bg-cyan-400 animate-bounce"
                      style={{ animationDelay: `${index * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={tutorEndRef} />
        </div>

        <div className="sticky bottom-0 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-3 py-3 sm:px-4 sm:py-4">
          {tutorError && <p className="text-xs text-rose-600 dark:text-rose-400 mb-2">{tutorError}</p>}

          <div className="relative">
            <textarea
              ref={tutorTextareaRef}
              value={tutorInput}
              onChange={(e) => {
                setTutorInput(e.target.value);
                resizeTutorTextarea();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTutorSend();
                }
              }}
              rows={1}
              placeholder="Ask AI Tutor anything about this file..."
              className="w-full resize-none overflow-hidden rounded-2xl border border-slate-300/80 dark:border-white/15 bg-white dark:bg-slate-900 px-4 py-3 pr-14 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/60 dark:focus:ring-cyan-500/60"
            />

            <button
              onClick={handleTutorSend}
              disabled={!tutorInput.trim() || isTutorTyping}
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                tutorInput.trim() && !isTutorTyping
                  ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/30 dark:shadow-cyan-500/30 hover:scale-105'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
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
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 dark:from-cyan-500/20 dark:to-violet-500/20 flex items-center justify-center">
            <FileText className="w-8 h-8 text-pink-600 dark:text-cyan-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading file...</p>
        </div>
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
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate max-w-full sm:max-w-sm lg:max-w-lg">
                {selectedFile?.originalName || 'Study file'}
              </h2>
              <div className="flex items-center gap-1.5">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id && !isTutorActive;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 border ${
                        isActive
                          ? 'text-pink-700 dark:text-cyan-300 bg-gradient-to-r from-pink-100 to-fuchsia-100 dark:from-violet-500/30 dark:to-cyan-500/30 border-pink-200 dark:border-cyan-500/40'
                          : 'text-slate-700 dark:text-slate-400 border-transparent hover:bg-pink-50 dark:hover:bg-cyan-900/20 hover:text-pink-900 dark:hover:text-cyan-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.shortLabel}</span>
                    </button>
                  );
                })}

                <button
                  onClick={handleTutorEntry}
                  className="group relative rounded-lg p-[1px] ml-1 overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                  title="Chat with AI Tutor"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 opacity-90 transition-opacity duration-200 group-hover:opacity-100" />
                  <span
                    className={`relative inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-[7px] text-xs sm:text-sm font-semibold border transition-colors duration-200 ${
                      isTutorActive
                        ? 'bg-white text-slate-950 border-white/90 dark:bg-black dark:text-white dark:border-black/90 shadow-sm'
                        : 'bg-white/95 dark:bg-slate-950/95 border-slate-200/70 dark:border-white/15 text-slate-900 dark:text-cyan-100'
                    }`}
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${
                        isTutorActive ? 'text-slate-900 dark:text-white' : 'text-fuchsia-500 dark:text-cyan-400'
                      }`}
                    />
                    <span className="hidden sm:inline">Chat with AI Tutor</span>
                    <span className="sm:hidden">Tutor</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {isTutorActive ? (
                <motion.div
                  key="tutor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                >
                  {renderTutorChat()}
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  {renderTabContent()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden lg:flex items-center justify-center gap-4 mt-5 text-xs text-slate-500 dark:text-slate-500">
            {!isTutorActive ? (
              <>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">←</kbd>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">→</kbd>
                  <span>Switch tabs</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">Esc</kbd>
                  <span>Exit</span>
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">Enter</kbd>
                  <span>Send message</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">Shift</kbd>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">Enter</kbd>
                  <span>New line</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

function getPreviewFileUrl(file: UploadedFile): string | null {
  const relativeUrl =
    file.downloadUrl || (file.fileName ? `/uploads/${encodeURIComponent(file.fileName)}` : null);

  if (!relativeUrl) return null;
  if (relativeUrl.startsWith('http')) return relativeUrl;
  if (import.meta.env.DEV && relativeUrl.startsWith('/')) return relativeUrl;

  const apiBase = (import.meta.env.VITE_API_URL as string) || '/api';
  const assetBase = apiBase.replace(/\/_?api\/?$/, '');
  return `${assetBase}${relativeUrl}`;
}

function getSourceUrl(file: UploadedFile): string | null {
  if (file.sourceUrl && /^https?:\/\//i.test(file.sourceUrl)) {
    return file.sourceUrl;
  }

  const extractedText = file.extractedText || '';
  const sourceMatch = extractedText.match(/^\s*Source URL:\s*(https?:\/\/\S+)/im);
  return sourceMatch?.[1] || null;
}

function getFileExtension(fileName?: string): string {
  return fileName?.toLowerCase().split('.').pop() || '';
}

function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    let videoId = '';
    if (host.includes('youtu.be')) {
      videoId = parsed.pathname.replace(/^\//, '').split('/')[0];
    } else if (host.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || '';
      } else {
        const parts = parsed.pathname.split('/').filter(Boolean);
        videoId = parts[1] || '';
      }
    }

    if (!videoId || videoId.length < 8) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

function OriginalContentPreview({ file }: { file: UploadedFile }) {
  const fileType = (file.fileType || '').toLowerCase();
  const extension = getFileExtension(file.originalName);
  const previewFileUrl = getPreviewFileUrl(file);
  const sourceUrl = getSourceUrl(file);
  const absolutePreviewFileUrl = previewFileUrl ? toAbsoluteUrl(previewFileUrl) : null;

  const isPowerPoint =
    fileType.includes('presentationml') ||
    fileType.includes('powerpoint') ||
    ['ppt', 'pptx', 'pps', 'ppsx'].includes(extension);

  const isWordOrExcel =
    fileType.includes('wordprocessingml') ||
    fileType.includes('msword') ||
    fileType.includes('spreadsheetml') ||
    fileType.includes('ms-excel') ||
    ['doc', 'docx', 'xls', 'xlsx'].includes(extension);

  const isPdf = fileType.includes('pdf') || extension === 'pdf';
  const isImage =
    fileType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(extension);
  const isVideo = fileType.startsWith('video/') && !fileType.includes('youtube');
  const isAudio = fileType.startsWith('audio/');
  const isWebLink = fileType.includes('text/url');
  const youtubeEmbedUrl = sourceUrl ? getYouTubeEmbedUrl(sourceUrl) : null;

  const officeViewerUrl =
    absolutePreviewFileUrl && (isPowerPoint || isWordOrExcel)
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absolutePreviewFileUrl)}`
      : null;

  const openTargetUrl = sourceUrl || previewFileUrl;

  const openOriginal = () => {
    if (!openTargetUrl) return;

    const openedWindow = window.open(openTargetUrl, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      alert('Popup blocked. Please allow popups and try again.');
    }
  };

  const downloadFile = () => {
    if (!previewFileUrl) return;

    const link = document.createElement('a');
    link.href = previewFileUrl;
    link.download = file.originalName || file.fileName || 'download';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Original Content</h3>
        <div className="flex items-center gap-2">
          {openTargetUrl && (
            <button
              onClick={openOriginal}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Original
            </button>
          )}
          {previewFileUrl && !isWebLink && (
            <button
              onClick={downloadFile}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          )}
        </div>
      </div>

      <div>
        {youtubeEmbedUrl ? (
          <iframe
            title="YouTube original content"
            src={youtubeEmbedUrl}
            className="w-full min-h-[68vh] border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : isWebLink && sourceUrl ? (
          <div className="space-y-3">
            <iframe
              title="Web page original content"
              src={sourceUrl}
              className="w-full min-h-[68vh] border-0 bg-white dark:bg-slate-900"
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
              If the page looks blank, the source site blocks embedding. Use Open Original to view it directly.
            </p>
          </div>
        ) : officeViewerUrl ? (
          <div className="space-y-3">
            <iframe
              title="Office document preview"
              src={officeViewerUrl}
              className="w-full min-h-[68vh] border-0 bg-white dark:bg-slate-900"
              referrerPolicy="no-referrer"
            />
            {isPowerPoint && (
              <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                PowerPoint is rendered through Office Web Viewer so you can browse all slides.
              </p>
            )}
          </div>
        ) : isPdf && previewFileUrl ? (
          <iframe
            title="PDF preview"
            src={previewFileUrl}
            className="w-full min-h-[68vh] border-0 bg-white dark:bg-slate-900"
          />
        ) : isImage && previewFileUrl ? (
          <div className="max-h-[72vh] overflow-auto bg-white dark:bg-slate-900 p-2">
            <img src={previewFileUrl} alt={file.originalName} className="w-full h-auto" />
          </div>
        ) : isVideo && previewFileUrl ? (
          <video src={previewFileUrl} controls className="w-full min-h-[48vh] bg-black" />
        ) : isAudio && previewFileUrl ? (
          <AudioTranscriptPlayer
            audioUrl={previewFileUrl}
            title={file.originalName}
            extractedText={file.extractedText || ''}
          />
        ) : file.extractedText && file.extractedText.trim().length > 0 ? (
          <div className="max-h-[68vh] overflow-y-auto bg-white/90 dark:bg-slate-900/80 p-4">
            <pre className="whitespace-pre-wrap break-words text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 font-sans">
              {file.extractedText}
            </pre>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Original content unavailable"
            description="We couldn't render a preview for this file type yet. Use Open Original to view the source directly."
          />
        )}
      </div>
    </div>
  );
}

type TranscriptCue = {
  timestamp: number;
  label: string;
  text: string;
};

function formatAudioClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function parseRecordingTranscript(extractedText: string): {
  cues: TranscriptCue[];
  fullTranscript: string;
} {
  const normalizedText = String(extractedText || '').trim();
  if (!normalizedText) {
    return { cues: [], fullTranscript: '' };
  }

  const cuePattern = /^\[(\d{2}):(\d{2}):(\d{2})\]\s*(.+)$/gm;
  const cues: TranscriptCue[] = [];

  for (const match of normalizedText.matchAll(cuePattern)) {
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
    const text = String(match[4] || '').trim();

    if (!text) continue;

    const timestamp = hours * 3600 + minutes * 60 + seconds;
    cues.push({
      timestamp,
      label: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
        seconds
      ).padStart(2, '0')}`,
      text,
    });
  }

  const fullTranscriptMatch = normalizedText.match(/(?:^|\n)\s*Full Transcript:\s*\n?([\s\S]*)$/i);

  const fallbackTranscript = normalizedText
    .replace(/^\s*Live Lecture Transcript\s*/i, '')
    .replace(/^\s*Captured:\s*.*$/gim, '')
    .replace(/^\s*Duration:\s*.*$/gim, '')
    .replace(/^\s*Timestamped Transcript:\s*/i, '')
    .replace(/^\s*Transcript:\s*/i, '')
    .replace(/^\s*Full Transcript:\s*/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const fullTranscript = fullTranscriptMatch?.[1]?.trim()
    ? fullTranscriptMatch[1].trim()
    : cues.length > 0
    ? cues.map((cue) => cue.text).join(' ')
    : fallbackTranscript;

  return { cues, fullTranscript };
}

function AudioTranscriptPlayer({
  audioUrl,
  title,
  extractedText,
}: {
  audioUrl: string;
  title: string;
  extractedText: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.9);

  const { cues, fullTranscript } = useMemo(
    () => parseRecordingTranscript(extractedText),
    [extractedText]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const seekTo = useCallback(
    (nextTime: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const maxDuration = Number.isFinite(duration) && duration > 0 ? duration : audio.duration || 0;
      const clampedTime = Math.max(0, Math.min(nextTime, maxDuration || 0));
      audio.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    },
    [duration]
  );

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const activeCueIndex = useMemo(() => {
    if (!cues.length) return -1;

    for (let index = cues.length - 1; index >= 0; index -= 1) {
      if (currentTime >= cues[index].timestamp) {
        return index;
      }
    }

    return 0;
  }, [cues, currentTime]);

  const handleCueClick = useCallback(
    (timestamp: number) => {
      seekTo(timestamp);
    },
    [seekTo]
  );

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeCurrentTime = Math.max(0, Math.min(currentTime, safeDuration || currentTime || 0));

  return (
    <div className="space-y-5">
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

      <div className="rounded-3xl border border-emerald-200/70 dark:border-emerald-500/25 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.2),transparent_50%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.2),transparent_45%),linear-gradient(135deg,#0f172a_0%,#111827_100%)] p-5 sm:p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/90">Live Recording</p>
            <h4 className="text-lg sm:text-xl font-semibold mt-1 line-clamp-2">{title}</h4>
          </div>
          <button
            type="button"
            onClick={togglePlayback}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white text-slate-900 hover:bg-emerald-100 transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={safeDuration > 0 ? safeDuration : 1}
            value={safeCurrentTime}
            onChange={(event) => seekTo(Number(event.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-100/90 font-mono">
            <span>{formatAudioClock(safeCurrentTime)}</span>
            <span>{formatAudioClock(safeDuration)}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-4 items-center">
          <div className="inline-flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => seekTo(safeCurrentTime - 10)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              <SkipBack className="w-4 h-4" />
              10s
            </button>
            <button
              type="button"
              onClick={() => seekTo(safeCurrentTime + 10)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              10s
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-emerald-100/90">
            <Volume2 className="w-4 h-4" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="w-full accent-emerald-300 cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Timestamped transcript</p>
        </div>

        {cues.length > 0 ? (
          <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1">
            {cues.map((cue, index) => {
              const isActive = activeCueIndex === index;

              return (
                <button
                  type="button"
                  key={`${cue.timestamp}-${index}`}
                  onClick={() => handleCueClick(cue.timestamp)}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                    isActive
                      ? 'border-emerald-400/80 bg-emerald-50 dark:bg-emerald-500/10'
                      : 'border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/50 bg-white/70 dark:bg-slate-900/40'
                  }`}
                >
                  <span className="inline-flex items-center text-[11px] font-mono tracking-wide text-emerald-700 dark:text-emerald-300 mb-1">
                    {cue.label}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{cue.text}</p>
                </button>
              );
            })}
          </div>
        ) : fullTranscript ? (
          <pre className="whitespace-pre-wrap break-words text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 font-sans max-h-[44vh] overflow-y-auto">
            {fullTranscript}
          </pre>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Transcript will appear here after processing.
          </p>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: typeof FileText;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
        <Icon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </div>
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
    summary: { title: 'No summary yet', button: 'Generate Summary', icon: BookOpen, stages: ['Analyzing content...', 'Extracting key points...', 'Synthesizing summary...', 'Finalizing...'] },
    notes: { title: 'No notes yet', button: 'Generate Notes', icon: FileText, stages: ['Scanning document...', 'Identifying concepts...', 'Organizing notes...', 'Adding details...'] },
    flashcards: { title: 'No flashcards yet', button: 'Generate Flashcards', icon: Layers, stages: ['Processing content...', 'Creating Q&A pairs...', 'Optimizing cards...', 'Finalizing deck...'] },
  };

  const config = labels[type];
  const Icon = config.icon;

  // Show full-screen loader when generating
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <GenerationLoader isVisible={true} stages={config.stages} size="lg" />
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-fuchsia-500/10 dark:from-cyan-500/10 dark:to-violet-500/10 border border-pink-500/20 dark:border-cyan-500/20 flex items-center justify-center">
        <Icon className="w-10 h-10 text-pink-600 dark:text-cyan-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{config.title}</h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-8">
        Let AI analyze your content and generate helpful study materials.
      </p>

      {extraContent}

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="px-6 py-3 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 dark:from-cyan-500 dark:to-violet-500 dark:hover:from-cyan-600 dark:hover:to-violet-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-pink-500/25 dark:shadow-cyan-500/25 hover:shadow-xl hover:shadow-pink-500/30 dark:hover:shadow-cyan-500/30"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {config.button}
        </span>
      </button>
    </div>
  );
}
