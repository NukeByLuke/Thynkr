/**
 * ImmersiveStudy Page - Zen Mode Study Interface
 * 
 * A highly polished, distraction-free study experience following the Aurora design system.
 * Features glassmorphism, smooth animations, and keyboard navigation.
 * 
 * CRITICAL: Layout context management ensures sidebar ALWAYS reappears on navigation away.
 */

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  ChevronDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
import { isQuizAnswerCorrect } from '@/utils/quizAnswerUtils';

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

function normalizeTutorMarkdown(content: string): string {
  return String(content || '')
    .replace(/(^|\n)H([1-6])\s*:\s*(.+)/gm, (_m, p1, lvl, txt) => `${p1}${'#'.repeat(Number(lvl))} ${String(txt).trim()}`)
    .replace(/(^|\n)\s*H([1-6])\s+(.+)/gm, (_m, p1, lvl, txt) => `${p1}${'#'.repeat(Number(lvl))} ${String(txt).trim()}`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Tab configuration with icons
const TABS: { id: TabType; label: string; shortLabel: string; icon: typeof BookOpen }[] = [
  { id: 'original', label: 'Original Content', shortLabel: 'Original', icon: FileText },
  { id: 'summary', label: 'Summary', shortLabel: 'Summary', icon: BookOpen },
  { id: 'notes', label: 'Notes', shortLabel: 'Notes', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', shortLabel: 'Flashcards', icon: Layers },
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
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable
      ) {
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
    questionTimings?: Record<string, number>,
    usedQuestions?: any[]
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

    // Fallback: Calculate score locally for temp-quizzes
    const questions = usedQuestions && usedQuestions.length > 0 ? usedQuestions : selectedQuiz?.questions || [];
    let score = 0;

    const getSubmittedAnswerForQuestion = (question: any, questionIndex: number): string | undefined => {
      const directIdKey = String(question?.id ?? '').trim();
      const orderValue = Number.isFinite(Number(question?.order))
        ? Number(question.order)
        : questionIndex;

      const candidateKeys = [
        directIdKey,
        `q-${orderValue}`,
        String(orderValue),
        String(questionIndex),
      ].filter((value) => value.length > 0);

      for (const key of candidateKeys) {
        if (Object.prototype.hasOwnProperty.call(answers, key)) {
          return answers[key];
        }
      }

      return undefined;
    };

    questions.forEach((q: any, index: number) => {
      const submittedAnswer = getSubmittedAnswerForQuestion(q, index);
      if (isQuizAnswerCorrect(submittedAnswer, q)) {
        score++;
      }
    });

    const total = questions.length;
    return {
      score,
      total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0,
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
              fileName={selectedFile.originalName}
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
                  Number of cards: <span className="text-pink-600 dark:text-cyan-300 font-semibold">{numCards}</span>
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNumCards((prev) => Math.max(10, prev - 5))}
                    disabled={numCards <= 10}
                    className="h-9 min-w-[3.25rem] rounded-lg border border-pink-200 bg-pink-50 text-pink-700 font-semibold transition-colors hover:bg-pink-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
                    aria-label="Decrease flashcards by five"
                  >
                    -5
                  </button>
                  <div className="min-w-[4.5rem] text-center text-base font-bold text-slate-900 dark:text-white tabular-nums">
                    {numCards}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNumCards((prev) => Math.min(50, prev + 5))}
                    disabled={numCards >= 50}
                    className="h-9 min-w-[3.25rem] rounded-lg border border-pink-200 bg-pink-50 text-pink-700 font-semibold transition-colors hover:bg-pink-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
                    aria-label="Increase flashcards by five"
                  >
                    +5
                  </button>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Min 10</span>
                  <span>Step 5</span>
                  <span>Max 50</span>
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
            onGenerateQuiz={(
              difficulty: string,
              numQuestions: number,
              questionTypes: Array<'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK'>
            ) => {
              generateQuizMutation.mutate({
                fileId: selectedFile.id,
                difficulty: difficulty.toUpperCase(),
                numQuestions,
                questionTypes,
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
      <div className="flex min-h-[56vh] sm:min-h-[62vh] max-h-[78vh] flex-col bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.12),transparent_35%),radial-gradient(circle_at_80%_100%,rgba(6,182,212,0.12),transparent_38%)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_35%),radial-gradient(circle_at_80%_100%,rgba(6,182,212,0.18),transparent_38%)]">
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
                className={`max-w-[92%] sm:max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-gradient-to-br from-pink-600 to-fuchsia-600 dark:from-cyan-500 dark:to-violet-500 text-white shadow-fuchsia-500/30'
                    : 'rounded-bl-md bg-white/95 dark:bg-slate-900/90 border border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:my-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {normalizeTutorMarkdown(message.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{message.content}</span>
                )}
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

        <div className="sticky bottom-0 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-4 sm:pt-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
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
      <div className="min-h-full">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 sm:line-clamp-1 max-w-full">
                {selectedFile?.originalName || 'Study file'}
              </h2>
              <div className="overflow-x-auto -mx-1 px-1 pb-1">
                <div className="flex items-center gap-1.5 min-w-max">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id && !isTutorActive;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`shrink-0 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 border ${
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
                    className="group relative shrink-0 rounded-lg p-[1px] ml-0.5 overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
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
                  className="p-3.5 sm:p-5 lg:p-6"
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
  const hasExternalSourceUrl =
    typeof file.sourceUrl === 'string' && /^https?:\/\//i.test(file.sourceUrl);

  if (hasExternalSourceUrl) {
    return null;
  }

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

function isExternallySourcedFile(file: UploadedFile): boolean {
  const type = String(file.fileType || '').toLowerCase();
  return (
    (typeof file.sourceUrl === 'string' && /^https?:\/\//i.test(file.sourceUrl)) ||
    type.includes('youtube') ||
    type.includes('text/url')
  );
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
  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(() => localStorage.getItem('my-notes-' + file.id) || '');
  const handleQuillChange = (content: string) => {
    setLocalNotes(content);
    localStorage.setItem('my-notes-' + file.id, content);
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Study Notes - ${file.originalName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; color: #1e293b; }
            h1 { font-size: 1.5rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
            .notes-content { white-space: pre-wrap; word-wrap: break-word; }
            .notes-content p { margin: 0 0 1em 0; }
            .notes-content ul, .notes-content ol { margin-left: 1.5rem; margin-bottom: 1em; }
          </style>
        </head>
        <body>
          <h1>Study Notes: ${file.originalName}</h1>
          <div class="notes-content">${localNotes}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportDoc = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + "<h1>Study Notes: " + file.originalName + "</h1><div style='white-space: pre-wrap; font-family: system-ui, sans-serif; word-wrap: break-word;'>" + localNotes + "</div>" + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = "notes-" + (file.originalName || 'document') + ".doc";
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };
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
  const canDownload = Boolean(previewFileUrl) && !isExternallySourcedFile(file);

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
    if (!canDownload || !previewFileUrl) return;

    const link = document.createElement('a');
    link.href = previewFileUrl;
    link.download = file.originalName || file.fileName || 'download';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[68vh]">
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full space-y-0 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Original Content</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors ${localNotes.length > 0 ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              {showNotes ? 'Close Notes' : (localNotes.length > 0 ? 'Saved Notes' : 'Take Notes')}
            </button>
            {openTargetUrl && (
              <button
                onClick={openOriginal}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Original
              </button>
            )}
            {canDownload && (
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 m-0">
          {youtubeEmbedUrl ? (
            <iframe
              title="YouTube original content"
              src={youtubeEmbedUrl}
              className="w-full min-h-[52vh] sm:min-h-[68vh] border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : isWebLink && sourceUrl ? (
            <div className="space-y-3">
              <iframe
                title="Web page original content"
                src={sourceUrl}
                className="w-full min-h-[52vh] sm:min-h-[68vh] border-0 bg-white dark:bg-slate-900"
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
                className="w-full min-h-[52vh] sm:min-h-[68vh] border-0 bg-white dark:bg-slate-900"
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
              title="PDF original content"
              src={previewFileUrl}
              className="w-full min-h-[52vh] sm:min-h-[68vh] border-0 rounded-b-3xl"
            />
          ) : isImage && previewFileUrl ? (
            <div className="flex min-h-[52vh] sm:min-h-[68vh] items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <img
                src={previewFileUrl}
                alt="Original content preview"
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
              />
            </div>
          ) : isAudio || isVideo ? (
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <AudioTranscriptPlayer
                audioUrl={absolutePreviewFileUrl!}
                title={file.originalName}
                extractedText={file.extractedText || ""}
              />
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
      
      {showNotes && (
        <div className="flex-1 lg:max-w-md xl:max-w-lg min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col min-h-[60vh] h-full shadow-sm animate-fade-in relative">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Notes</h3>
                        <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hidden sm:inline-block">Auto-saves locally</span>
              
              <div className="relative group">
                <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Download className="w-3.5 h-3.5" />
                  Export
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </button>
                <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-[100]">
                  <div className="w-40 flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl flex">
                    <button 
                      onClick={handleExportPdf}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      Export as PDF
                    </button>
                    <button 
                      onClick={handleExportDoc}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      Export to Google Docs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[50vh] overflow-hidden custom-quill-container bg-transparent text-slate-700 dark:text-slate-300">
            <ReactQuill 
              theme="snow"
              value={localNotes}
              onChange={handleQuillChange}
              className="h-full flex flex-col"
              placeholder="Type your study notes here..."
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ]
              }}
            />
            <style>{`
              .custom-quill-container .ql-toolbar {
                border: none;
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                background: transparent;
                padding: 12px;
              }
              .dark .custom-quill-container .ql-toolbar .ql-stroke {
                stroke: #cbd5e1;
              }
              .dark .custom-quill-container .ql-toolbar .ql-fill {
                fill: #cbd5e1;
              }
              .dark .custom-quill-container .ql-toolbar .ql-picker {
                color: #cbd5e1;
              }
              .custom-quill-container .ql-container {
                border: none;
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                font-family: inherit;
                font-size: 1.125rem;
              }
              .custom-quill-container .ql-editor {
                flex: 1;
                overflow-y: auto;
                padding: 1.25rem;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

type TranscriptCue = {
  start: number;
  end: number;
  label: string;
  text: string;
};

const MIN_TRANSCRIPT_SEGMENT_SECONDS = 0.45;

function formatAudioClock(totalSeconds: number, fallback: string = '0:00'): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return fallback;
  }

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

function normalizeTranscriptSentence(rawText: string): string {
  const compact = String(rawText || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!compact) return '';

  const leadingUpper = compact.charAt(0).toUpperCase() + compact.slice(1);
  const normalizedPronouns = leadingUpper.replace(/\bi\b/g, 'I');

  if (/[.!?]$/.test(normalizedPronouns)) {
    return normalizedPronouns;
  }

  return `${normalizedPronouns}.`;
}

function formatTranscriptBody(rawText: string): string {
  const compact = String(rawText || '').replace(/\s+/g, ' ').trim();
  if (!compact) return '';

  const sentenceFragments = compact
    .split(/(?<=[.!?])\s+/)
    .map(normalizeTranscriptSentence)
    .filter(Boolean);

  if (!sentenceFragments.length) {
    return normalizeTranscriptSentence(compact);
  }

  return sentenceFragments.join('\n\n');
}

function formatCueLabel(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const wholeSeconds = Math.floor(safeSeconds);
  const hours = Math.floor(wholeSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((wholeSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(wholeSeconds % 60)
    .toString()
    .padStart(2, '0');
  const tenths = Math.floor((safeSeconds - wholeSeconds) * 10)
    .toString()
    .padStart(1, '0');

  return `${hours}:${minutes}:${seconds}.${tenths}`;
}

function buildCueRangeLabel(startSeconds: number, endSeconds: number): string {
  return `${formatCueLabel(startSeconds)} -> ${formatCueLabel(endSeconds)}`;
}

function estimateTranscriptSegmentSeconds(text: string): number {
  const wordCount = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.min(8, Math.max(0.9, wordCount / 2.4));
}

function roundCueSecond(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function parseTimestampPartsToSeconds(
  hoursRaw: string,
  minutesRaw: string,
  secondsRaw: string,
  fractionRaw?: string
): number {
  const hours = Number(hoursRaw || 0);
  const minutes = Number(minutesRaw || 0);
  const seconds = Number(secondsRaw || 0);
  const fraction = fractionRaw ? Number(`0.${fractionRaw}`) : 0;

  return Math.max(0, hours * 3600 + minutes * 60 + seconds + fraction);
}

function parseTimelineRangeCues(normalizedText: string): TranscriptCue[] {
  const rangePattern =
    /^\[(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\s*(?:->|to|-)\s*(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.+)$/gm;
  const cues: TranscriptCue[] = [];

  for (const match of normalizedText.matchAll(rangePattern)) {
    const start = parseTimestampPartsToSeconds(match[1], match[2], match[3], match[4]);
    const parsedEnd = parseTimestampPartsToSeconds(match[5], match[6], match[7], match[8]);
    const text = normalizeTranscriptSentence(String(match[9] || ''));

    if (!text) continue;

    const end = Math.max(start + MIN_TRANSCRIPT_SEGMENT_SECONDS, parsedEnd);
    cues.push({
      start,
      end,
      label: buildCueRangeLabel(start, end),
      text,
    });
  }

  return cues;
}

function parseTimelinePointCues(
  normalizedText: string,
  hasSpeechStartTimelineAnchor: boolean
): TranscriptCue[] {
  const cuePattern = /^\[(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.+)$/gm;
  const cues: TranscriptCue[] = [];

  for (const match of normalizedText.matchAll(cuePattern)) {
    const originalTimestamp = parseTimestampPartsToSeconds(match[1], match[2], match[3], match[4]);
    const text = normalizeTranscriptSentence(String(match[5] || ''));

    if (!text) continue;

    const estimatedSegmentDuration = estimateTranscriptSegmentSeconds(text);
    const start = hasSpeechStartTimelineAnchor
      ? originalTimestamp
      : Math.max(0, originalTimestamp - estimatedSegmentDuration);
    const end = hasSpeechStartTimelineAnchor
      ? start + estimatedSegmentDuration
      : Math.max(originalTimestamp, start + MIN_TRANSCRIPT_SEGMENT_SECONDS);

    cues.push({
      start,
      end,
      label: buildCueRangeLabel(start, end),
      text,
    });
  }

  return cues;
}

function extractDeclaredRecordingDurationSeconds(rawText: string): number {
  const explicitSecondsMatch = String(rawText || '').match(/(?:^|\n)\s*Duration:\s*.*\((\d+)s\)/i);
  if (explicitSecondsMatch?.[1]) {
    return Math.max(0, Number(explicitSecondsMatch[1]) || 0);
  }

  const clockOnlyMatch = String(rawText || '').match(
    /(?:^|\n)\s*Duration:\s*(\d{2}):(\d{2}):(\d{2})(?:\s|$)/i
  );
  if (clockOnlyMatch) {
    const hours = Number(clockOnlyMatch[1] || 0);
    const minutes = Number(clockOnlyMatch[2] || 0);
    const seconds = Number(clockOnlyMatch[3] || 0);
    return Math.max(0, hours * 3600 + minutes * 60 + seconds);
  }

  return 0;
}

function splitTranscriptForCueGeneration(rawText: string): string[] {
  const compact = String(rawText || '').replace(/\s+/g, ' ').trim();
  if (!compact) return [];

  const sentenceChunks = compact
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 80);

  if (sentenceChunks.length > 1) {
    return sentenceChunks;
  }

  const words = compact.split(/\s+/).filter(Boolean);
  if (words.length <= 14) {
    return sentenceChunks;
  }

  const fallbackChunks: string[] = [];
  for (let index = 0; index < words.length; index += 12) {
    fallbackChunks.push(words.slice(index, index + 12).join(' ').trim());
  }

  return fallbackChunks.filter(Boolean).slice(0, 80);
}

function buildSyntheticTranscriptCues(
  fullTranscript: string,
  declaredDurationSeconds: number
): TranscriptCue[] {
  const transcriptChunks = splitTranscriptForCueGeneration(fullTranscript);
  if (!transcriptChunks.length) {
    return [];
  }

  if (transcriptChunks.length === 1) {
    const text = normalizeTranscriptSentence(transcriptChunks[0]);
    return text
      ? [
          {
            start: 0,
            end: roundCueSecond(estimateTranscriptSegmentSeconds(text)),
            label: buildCueRangeLabel(0, estimateTranscriptSegmentSeconds(text)),
            text,
          },
        ]
      : [];
  }

  const chunkWeights = transcriptChunks.map((chunk) =>
    Math.max(1, chunk.split(/\s+/).filter(Boolean).length)
  );
  const totalWeight = chunkWeights.reduce((sum, weight) => sum + weight, 0);

  const minimumDuration = transcriptChunks.length * MIN_TRANSCRIPT_SEGMENT_SECONDS;
  const estimatedDuration = transcriptChunks.reduce(
    (sum, chunk) => sum + estimateTranscriptSegmentSeconds(chunk),
    0
  );

  const safeDuration =
    declaredDurationSeconds > 0
      ? Math.max(declaredDurationSeconds, minimumDuration)
      : Math.max(estimatedDuration, minimumDuration);

  let elapsedWeight = 0;

  return transcriptChunks
    .map((chunk, index) => {
      const text = normalizeTranscriptSentence(chunk);
      const start = (elapsedWeight / totalWeight) * safeDuration;
      elapsedWeight += chunkWeights[index];
      const end =
        index === transcriptChunks.length - 1
          ? safeDuration
          : (elapsedWeight / totalWeight) * safeDuration;
      return {
        start: roundCueSecond(start),
        end: roundCueSecond(Math.max(end, start + MIN_TRANSCRIPT_SEGMENT_SECONDS)),
        label: buildCueRangeLabel(start, end),
        text,
      };
    })
    .filter((cue) => cue.text.length > 0);
}

function normalizeTranscriptCues(
  cues: TranscriptCue[],
  declaredDurationSeconds: number
): TranscriptCue[] {
  if (!cues.length) {
    return [];
  }

  const sortedCues = [...cues]
    .filter((cue) => cue.text.length > 0)
    .sort((a, b) => a.start - b.start)
    .filter((cue, index, array) => {
      if (index === 0) return true;
      const previous = array[index - 1];
      return previous.text !== cue.text || Math.abs(previous.start - cue.start) > 0.05;
    });

  if (!sortedCues.length) {
    return [];
  }

  const uniqueStartBucketCount = new Set(sortedCues.map((cue) => Math.floor(cue.start * 2))).size;
  const hasHeavyOverlap =
    sortedCues.length > 1 &&
    uniqueStartBucketCount <= Math.max(1, Math.ceil(sortedCues.length * 0.6));

  let workingCues = sortedCues;
  if (hasHeavyOverlap && sortedCues.length > 1) {
    const safeDuration =
      declaredDurationSeconds > 0
        ? Math.max(declaredDurationSeconds, sortedCues.length * MIN_TRANSCRIPT_SEGMENT_SECONDS)
        : Math.max(
            sortedCues[sortedCues.length - 1].end,
            sortedCues.length * MIN_TRANSCRIPT_SEGMENT_SECONDS * 2
          );
    const maxStart = Math.max(0, safeDuration - MIN_TRANSCRIPT_SEGMENT_SECONDS);

    workingCues = sortedCues.map((cue, index) => ({
      ...cue,
      start: (index / Math.max(1, sortedCues.length - 1)) * maxStart,
    }));
  }

  const adjustedStarts: number[] = [];
  for (let index = 0; index < workingCues.length; index += 1) {
    const cue = workingCues[index];
    if (index === 0) {
      adjustedStarts.push(Math.max(0, cue.start));
      continue;
    }

    adjustedStarts.push(
      Math.max(Math.max(0, cue.start), adjustedStarts[index - 1] + MIN_TRANSCRIPT_SEGMENT_SECONDS)
    );
  }

  const lastIndex = adjustedStarts.length - 1;
  const estimatedTailDuration = estimateTranscriptSegmentSeconds(workingCues[lastIndex].text);
  let safeDuration =
    declaredDurationSeconds > 0
      ? declaredDurationSeconds
      : Math.max(
          workingCues[lastIndex].end,
          adjustedStarts[lastIndex] + Math.max(estimatedTailDuration, MIN_TRANSCRIPT_SEGMENT_SECONDS)
        );

  if (safeDuration < adjustedStarts[lastIndex] + MIN_TRANSCRIPT_SEGMENT_SECONDS) {
    safeDuration = adjustedStarts[lastIndex] + MIN_TRANSCRIPT_SEGMENT_SECONDS;
  }

  return workingCues.map((cue, index) => {
    const start = adjustedStarts[index];
    const end =
      index === lastIndex
        ? safeDuration
        : Math.max(adjustedStarts[index + 1], start + MIN_TRANSCRIPT_SEGMENT_SECONDS);

    return {
      ...cue,
      start: roundCueSecond(start),
      end: roundCueSecond(end),
      label: buildCueRangeLabel(start, end),
    };
  });
}

function parseRecordingTranscript(extractedText: string): {
  cues: TranscriptCue[];
  fullTranscript: string;
  declaredDuration: number;
  inferredDuration: number;
} {
  const normalizedText = String(extractedText || '').trim();
  if (!normalizedText) {
    return { cues: [], fullTranscript: '', declaredDuration: 0, inferredDuration: 0 };
  }

  const declaredDuration = extractDeclaredRecordingDurationSeconds(normalizedText);
  const hasSpeechStartTimelineAnchor =
    /(?:^|\n)\s*Timing Anchor:\s*Speech Start\s*(?:\n|$)/i.test(normalizedText);

  const parsedRangeCues = parseTimelineRangeCues(normalizedText);
  const parsedPointCues = parseTimelinePointCues(normalizedText, hasSpeechStartTimelineAnchor);
  const normalizedParsedCues = normalizeTranscriptCues(
    parsedRangeCues.length > 0 ? parsedRangeCues : parsedPointCues,
    declaredDuration
  );

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
    ? formatTranscriptBody(fullTranscriptMatch[1])
    : normalizedParsedCues.length > 0
    ? formatTranscriptBody(normalizedParsedCues.map((cue) => cue.text).join(' '))
    : formatTranscriptBody(fallbackTranscript);

  const syntheticCues = buildSyntheticTranscriptCues(fullTranscript, declaredDuration);
  const cueCoverageRatio = fullTranscript
    ? normalizedParsedCues.map((cue) => cue.text).join(' ').length /
      Math.max(1, fullTranscript.replace(/\s+/g, ' ').trim().length)
    : 1;

  const shouldUseSyntheticCues =
    syntheticCues.length > 1 && (normalizedParsedCues.length === 0 || cueCoverageRatio < 0.55);

  const finalCues = shouldUseSyntheticCues
    ? normalizeTranscriptCues(syntheticCues, declaredDuration)
    : normalizedParsedCues;

  const inferredDuration = Math.max(
    declaredDuration,
    finalCues.length ? finalCues[finalCues.length - 1].end : 0
  );

  return { cues: finalCues, fullTranscript, declaredDuration, inferredDuration };
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
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.9);

  const { cues, fullTranscript, declaredDuration, inferredDuration } = useMemo(
    () => parseRecordingTranscript(extractedText),
    [extractedText]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        return;
      }

      if (audio.seekable && audio.seekable.length > 0) {
        const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
        if (Number.isFinite(seekableEnd) && seekableEnd > 0) {
          setDuration(seekableEnd);
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    audio.addEventListener('canplay', syncDuration);
    audio.addEventListener('progress', syncDuration);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', syncDuration);
      audio.removeEventListener('durationchange', syncDuration);
      audio.removeEventListener('canplay', syncDuration);
      audio.removeEventListener('progress', syncDuration);
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
    (nextTime: number): number | null => {
      const audio = audioRef.current;
      if (!audio) return null;

      const maxDuration =
        Number.isFinite(duration || 0) && (duration || 0) > 0
          ? (duration as number)
          : Number.isFinite(declaredDuration) && declaredDuration > 0
          ? declaredDuration
          : Number.isFinite(inferredDuration) && inferredDuration > 0
          ? inferredDuration
          : 0;

      if (!maxDuration || maxDuration <= 0) {
        return null;
      }

      const clampedTime = Math.max(0, Math.min(nextTime, maxDuration || 0));
      audio.currentTime = clampedTime;
      setCurrentTime(clampedTime);
      return clampedTime;
    },
    [declaredDuration, duration, inferredDuration]
  );

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const knownDuration =
      Number.isFinite(duration || 0) && (duration || 0) > 0
        ? (duration as number)
        : Number.isFinite(declaredDuration) && declaredDuration > 0
        ? declaredDuration
        : Number.isFinite(inferredDuration) && inferredDuration > 0
        ? inferredDuration
        : 0;

    if (audio.paused) {
      if (knownDuration > 0 && currentTime >= knownDuration - 0.25) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }

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
  }, [currentTime, declaredDuration, duration, inferredDuration]);

  const activeCueIndex = useMemo(() => {
    if (!cues.length) return -1;

    for (let index = 0; index < cues.length; index += 1) {
      const cue = cues[index];
      const isLastCue = index === cues.length - 1;

      if (currentTime >= cue.start && (currentTime < cue.end || isLastCue)) {
        return index;
      }
    }

    return currentTime < cues[0].start ? 0 : cues.length - 1;
  }, [cues, currentTime]);

  const handleCueClick = useCallback(
    async (start: number) => {
      const seekedTime = seekTo(Math.max(0, start));
      if (seekedTime === null) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(!audio.paused);
      }
    },
    [seekTo]
  );

  const effectiveDuration = useMemo(() => {
    if (Number.isFinite(duration || 0) && (duration || 0) > 0) {
      return duration as number;
    }

    const observedPlaybackDuration = currentTime > 0 ? currentTime + 1 : 0;

    if (declaredDuration > 0 || inferredDuration > 0 || observedPlaybackDuration > 0) {
      return Math.max(declaredDuration, inferredDuration, observedPlaybackDuration);
    }

    if (Number.isFinite(inferredDuration) && inferredDuration > 0) {
      return inferredDuration;
    }

    return 0;
  }, [currentTime, declaredDuration, duration, inferredDuration]);

  const canSeek = effectiveDuration > 0;
  const safeCurrentTime = Math.max(
    0,
    Math.min(currentTime, canSeek ? effectiveDuration : currentTime || 0)
  );
  const playbackPercent = canSeek ? Math.min(100, (safeCurrentTime / effectiveDuration) * 100) : 0;
  const timeStartLabel = formatAudioClock(safeCurrentTime, '0:00');
  const timeEndLabel = canSeek ? formatAudioClock(effectiveDuration, '--:--') : '--:--';

  return (
    <div className="space-y-5">
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

      <div className="rounded-3xl border border-sunrise-pink/30 dark:border-midnight-cyan/30 bg-gradient-to-br from-sunrise-fuchsia/15 via-white/95 to-sunrise-orange/20 dark:from-midnight-violet/25 dark:via-slate-950/90 dark:to-midnight-blue/25 p-5 sm:p-6 shadow-[0_16px_40px_rgba(236,72,153,0.15)] dark:shadow-[0_16px_44px_rgba(6,182,212,0.16)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sunrise-fuchsia dark:text-midnight-cyan">
              Live Recording
            </p>
            <h4 className="text-lg sm:text-xl font-semibold mt-1 line-clamp-2 text-slate-900 dark:text-slate-50">
              {title}
            </h4>
          </div>
          <button
            type="button"
            onClick={togglePlayback}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-sunrise-fuchsia to-sunrise-orange dark:from-midnight-cyan dark:to-midnight-violet text-white hover:brightness-105 transition-all shadow-lg shadow-sunrise-pink/30 dark:shadow-midnight-cyan/25"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative h-3">
            <div className="absolute inset-0 rounded-full bg-slate-200/80 dark:bg-white/10" />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sunrise-fuchsia via-sunrise-pink to-sunrise-orange dark:from-midnight-cyan dark:via-midnight-blue dark:to-midnight-violet"
              animate={{ width: `${playbackPercent}%` }}
              transition={{ duration: 0.15, ease: 'linear' }}
            />
            <input
              type="range"
              min={0}
              max={canSeek ? effectiveDuration : 1}
              value={canSeek ? safeCurrentTime : 0}
              onChange={(event) => seekTo(Number(event.target.value))}
              disabled={!canSeek}
              className="absolute inset-0 h-3 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-mono">
            <span>{timeStartLabel}</span>
            <span>{timeEndLabel}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-4 items-center">
          <div className="inline-flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => seekTo(safeCurrentTime - 10)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-100 hover:bg-sunrise-pink/10 dark:hover:bg-midnight-cyan/15 transition-colors text-sm border border-slate-200/80 dark:border-white/10"
            >
              <SkipBack className="w-4 h-4" />
              10s
            </button>
            <button
              type="button"
              onClick={() => seekTo(safeCurrentTime + 10)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-100 hover:bg-sunrise-pink/10 dark:hover:bg-midnight-cyan/15 transition-colors text-sm border border-slate-200/80 dark:border-white/10"
            >
              10s
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <Volume2 className="w-4 h-4 text-sunrise-fuchsia dark:text-midnight-cyan" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: 'var(--color-primary)' }}
            />
          </label>
        </div>

        {!canSeek && (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
            Calculating audio duration. You can still play now, and seeking will enable automatically.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-950/55 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Clock3 className="w-4 h-4 text-sunrise-fuchsia dark:text-midnight-cyan" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Timestamped transcript</p>
          {cues.length > 0 && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              {cues.length} cues
            </span>
          )}
        </div>

        {cues.length > 0 ? (
          <div className="space-y-2.5 max-h-[44vh] overflow-y-auto pr-1">
            {cues.map((cue, index) => {
              const isActive = activeCueIndex === index;

              return (
                <button
                  type="button"
                  key={`${cue.start}-${cue.end}-${index}`}
                  onClick={() => handleCueClick(cue.start)}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                    isActive
                      ? 'border-sunrise-pink/70 bg-sunrise-pink/10 dark:border-midnight-cyan/60 dark:bg-midnight-cyan/10 shadow-sm'
                      : 'border-slate-200/90 dark:border-white/10 hover:border-sunrise-pink/45 dark:hover:border-midnight-cyan/45 bg-white/80 dark:bg-slate-900/40'
                  }`}
                >
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-mono tracking-wide bg-white/90 dark:bg-black/30 text-sunrise-fuchsia dark:text-midnight-cyan mb-1.5">
                    {cue.label}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{cue.text}</p>
                </button>
              );
            })}
          </div>
        ) : fullTranscript ? (
          <pre className="whitespace-pre-wrap break-words text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 font-sans max-h-[44vh] overflow-y-auto rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/35 p-3.5">
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
    <div className="text-center py-12 sm:py-16">
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
      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
        <GenerationLoader isVisible={true} stages={config.stages} size="lg" />
      </div>
    );
  }

  return (
    <div className="text-center py-12 sm:py-16">
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
