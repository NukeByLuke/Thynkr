/**
 * Study Mode Page - Full-page AI Study Experience
 * 
 * A dedicated page for AI-powered study mode with summary, notes, quiz, and flashcards.
 * Uses the same rich components as ImmersiveStudy (FlashcardViewer, QuizPlayer, SummaryView, NotesView).
 * Supports share token forwarding so private shared courses can be studied.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  FileText,
  BookOpen,
  HelpCircle,
  Layers,
  Loader2,
  AlertCircle,
  Lock,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useLayout } from '@/contexts/LayoutContext';
import FileSelectionPane from '@/features/study/FileSelectionPane';
import SummaryView from '@/features/study/SummaryView';
import NotesView from '@/features/study/NotesView';
import FlashcardViewer from '@/features/study/FlashcardViewer';
import QuizPlayer from '@/features/study/QuizPlayer';

type StudyTab = 'summary' | 'notes' | 'quiz' | 'flashcards';

interface CourseFile {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  isAICompatible: boolean;
}

interface StudyStatusResponse {
  canStudy: boolean;
  reason: string;
  isOwner: boolean;
  role: string;
  totalFiles: number;
  aiCompatibleFiles: number;
  files: CourseFile[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
}

const TABS: { id: StudyTab; label: string; icon: typeof FileText; color: string }[] = [
  { id: 'summary', label: 'Summary', icon: FileText, color: 'text-blue-500' },
  { id: 'notes', label: 'Notes', icon: BookOpen, color: 'text-green-500' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-purple-500' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, color: 'text-orange-500' },
];

export default function StudyModePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setHideSidebar, setCustomHeaderContent, setHideProfileMenu } = useLayout();

  const [activeTab, setActiveTab] = useState<StudyTab>('summary');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Build query string helper for share token
  const tokenQuery = shareToken ? `token=${shareToken}` : '';

  // Hide the main app sidebar and profile menu for immersive experience
  useEffect(() => {
    setHideSidebar(true);
    setHideProfileMenu(true);
    return () => {
      setHideSidebar(false);
      setCustomHeaderContent(null);
      setHideProfileMenu(false);
    };
  }, [setHideSidebar, setCustomHeaderContent, setHideProfileMenu]);

  // Keyboard navigation (A/D for tabs, Esc to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
        navigate(`/courses/${courseId}${shareToken ? `?token=${shareToken}` : ''}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, courseId, shareToken, navigate]);

  // Fetch course details (with share token)
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['course', courseId, shareToken],
    queryFn: async () => {
      const url = shareToken
        ? `/user-courses/${courseId}?token=${shareToken}`
        : `/user-courses/${courseId}`;
      const response = await api.get(url);
      return response.data.course;
    },
    enabled: !!courseId,
  });

  // Fetch study access status (with share token)
  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery<StudyStatusResponse>({
    queryKey: ['study-status', courseId, shareToken],
    queryFn: async () => {
      const url = shareToken
        ? `/ai/study/status/${courseId}?token=${shareToken}`
        : `/ai/study/status/${courseId}`;
      const response = await api.get(url);
      return response.data;
    },
    enabled: !!courseId,
  });

  // Auto-select all AI-compatible files on load
  useEffect(() => {
    if (statusData?.files) {
      const aiFiles = statusData.files.filter((f) => f.isAICompatible);
      if (aiFiles.length > 0 && selectedFileIds.size === 0) {
        setSelectedFileIds(new Set(aiFiles.map((f) => f.id)));
      }
    }
  }, [statusData?.files]);

  // Inject header content into DashboardLayout header (avoids double header)
  useEffect(() => {
    setCustomHeaderContent(
      <div className="flex items-center gap-2.5 sm:gap-4 w-full">
        {/* Left: Back button */}
        <Link
          to={`/courses/${courseId}${shareToken ? `?token=${shareToken}` : ''}`}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-cyan-400 hover:bg-pink-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>

        {/* Center: Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400 flex-shrink-0" />
          <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
            {course?.title || 'AI Study Mode'}
          </h2>
        </div>

        {/* Right: Sidebar toggle */}
        <button
          onClick={() => setShowSidebar(prev => !prev)}
          className="ml-auto hidden md:flex p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={showSidebar ? 'Hide files' : 'Show files'}
        >
          <Menu className="h-4 w-4" />
        </button>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="ml-auto md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
    );
    return () => setCustomHeaderContent(null);
  }, [courseId, shareToken, course?.title, showSidebar, setCustomHeaderContent]);

  // Generate study content mutation (with share token)
  const generateMutation = useMutation({
    mutationFn: async ({ type, refresh = false }: { type: StudyTab; refresh?: boolean }) => {
      const params = [refresh ? 'refresh=true' : '', tokenQuery].filter(Boolean).join('&');
      const url = params ? `/ai/study?${params}` : '/ai/study';
      const response = await api.post(url, {
        courseId,
        fileIds: Array.from(selectedFileIds),
        type,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['study-content', courseId, Array.from(selectedFileIds).sort().join(','), activeTab],
        data
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate study content');
    },
  });

  // Get cached content manually (no auto-fetch)
  const fileIdsKey = useMemo(() => Array.from(selectedFileIds).sort().join(','), [selectedFileIds]);

  const studyContent = queryClient.getQueryData<any>(['study-content', courseId, fileIdsKey, activeTab]);

  const handleRegenerate = () => {
    generateMutation.mutate({ type: activeTab, refresh: true });
  };

  const handleTabChange = useCallback((tab: StudyTab) => {
    setActiveTab(tab);
    setCurrentPage(0);
  }, []);

  // Total pages for current content (summary/notes have per-file pages)
  const totalPages = useMemo(() => {
    if ((activeTab === 'summary' || activeTab === 'notes') && studyContent?.result?.pages) {
      return studyContent.result.pages.length;
    }
    return 1;
  }, [activeTab, studyContent]);

  // Clamp currentPage when totalPages changes (e.g. fewer files selected)
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  // Arrow key page flipping (←/→)
  useEffect(() => {
    if (totalPages <= 1) return;
    const handlePageKeys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        e.preventDefault();
        setCurrentPage(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
        e.preventDefault();
        setCurrentPage(prev => prev + 1);
      }
    };
    window.addEventListener('keydown', handlePageKeys);
    return () => window.removeEventListener('keydown', handlePageKeys);
  }, [totalPages, currentPage]);

  // Quiz submit handler (score locally since course study has no quiz record)
  const handleQuizSubmit = useCallback(async (
    answers: Record<string, string>,
    _timeSpentSeconds?: number,
    _questionTimings?: Record<string, number>
  ) => {
    const questions = studyContent?.result?.questions || [];
    let score = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] === q.correctAnswer) score++;
    });
    return {
      score,
      total: questions.length,
      percentage: questions.length > 0 ? Math.round((score / questions.length) * 100) : 0,
    };
  }, [studyContent]);

  const isGenerating = generateMutation.isPending;
  const isLoading = courseLoading || statusLoading;

  // Page title
  const pageTitle = course?.title ? `Study: ${course.title}` : 'Study Mode';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-app flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading study mode...</p>
        </div>
      </div>
    );
  }

  // Error or no access
  if (statusError || !statusData?.canStudy) {
    return (
      <>
        <Helmet>
          <title>Access Restricted - Thynkr</title>
        </Helmet>
        <div className="min-h-app flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-slate-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Study Access Restricted
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {statusData?.reason || 'You do not have access to study this course.'}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // No AI-compatible files
  if (statusData.aiCompatibleFiles === 0) {
    return (
      <>
        <Helmet>
          <title>No Compatible Files - Thynkr</title>
        </Helmet>
        <div className="min-h-app flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-slate-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              No Compatible Files
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This course doesn't have any files that support AI study features. Upload PDFs, Word
              documents, or text files to get started.
            </p>
            <Link
              to={`/courses/${courseId}${shareToken ? `?token=${shareToken}` : ''}`}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle} - Thynkr</title>
        <meta name="description" content={`AI-powered study mode for ${course?.title || 'your course'}`} />
        <meta property="og:title" content={`Study: ${course?.title || 'AI Study Mode'} — Thynkr`} />
        <meta property="og:description" content={`Study ${course?.title || 'your course'} with AI summaries, flashcards, quizzes & notes.`} />
        <meta property="og:image" content={`${window.location.origin}/brand/og-default.png`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Study: ${course?.title || 'AI Study Mode'} — Thynkr`} />
        <meta name="twitter:description" content={`Study ${course?.title || 'your course'} with AI summaries, flashcards, quizzes & notes.`} />
        <meta name="twitter:image" content={`${window.location.origin}/brand/og-default.png`} />
      </Helmet>

      <div className="min-h-full flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - File Selection (Desktop) */}
          <AnimatePresence mode="wait">
            {showSidebar && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Select Files to Study
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedFileIds.size} of {statusData.aiCompatibleFiles} selected
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <FileSelectionPane
                    files={statusData.files}
                    selectedFileIds={selectedFileIds}
                    onSelectionChange={setSelectedFileIds}
                    onFileOpen={(fileId) => navigate(`/study/${fileId}`)}
                    isLoading={isGenerating}
                    disabled={isGenerating}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                  onClick={() => setMobileSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[min(85vw,18rem)] bg-white dark:bg-slate-900 shadow-xl flex flex-col"
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Select Files
                    </h2>
                    <button
                      onClick={() => setMobileSidebarOpen(false)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <FileSelectionPane
                      files={statusData.files}
                      selectedFileIds={selectedFileIds}
                      onSelectionChange={(ids) => {
                        setSelectedFileIds(ids);
                      }}
                      onFileOpen={(fileId) => navigate(`/study/${fileId}`)}
                      isLoading={isGenerating}
                      disabled={isGenerating}
                    />
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Study Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Study Mode Tabs - Quizlet Style */}
            <LayoutGroup>
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 sm:px-2 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      disabled={selectedFileIds.size === 0}
                      whileHover={selectedFileIds.size > 0 ? { y: -2 } : {}}
                      whileTap={selectedFileIds.size > 0 ? { scale: 0.97 } : {}}
                      className={`relative flex items-center gap-2 px-3 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                        isActive
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="studyActiveTab"
                          className="absolute inset-x-2 bottom-0 h-1 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 dark:from-cyan-400 dark:via-violet-500 dark:to-fuchsia-500 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="studyActiveTabBg"
                          className="absolute inset-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg -z-10"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <tab.icon className={`h-4 w-4 transition-colors ${isActive ? tab.color : 'text-slate-400'}`} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </LayoutGroup>

            {/* Content Area - Single scrollable container */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {selectedFileIds.size === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center justify-center min-h-[56vh] sm:min-h-[60vh] p-5 sm:p-8 text-center"
                  >
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl mb-5">
                      <Sparkles className="h-12 w-12 sm:h-14 sm:w-14 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Select Files to Study
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">
                      Choose one or more files from the sidebar to generate AI-powered study materials.
                    </p>
                    <button
                      onClick={() => setMobileSidebarOpen(true)}
                      className="md:hidden w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Select Files
                    </button>
                  </motion.div>
                ) : !studyContent?.result ? (
                  <motion.div
                    key="generate-prompt"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center justify-center min-h-[56vh] sm:min-h-[60vh] p-5 sm:p-8 text-center"
                  >
                    {isGenerating ? (
                      <>
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full blur-xl opacity-30" />
                          <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-indigo-600 relative z-10" />
                        </div>
                        <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                          Generating {activeTab}...
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          This may take a moment for large files
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl mb-5">
                          {TABS.find(t => t.id === activeTab)?.icon && (
                            <div className={TABS.find(t => t.id === activeTab)!.color}>
                              {(() => {
                                const Icon = TABS.find(t => t.id === activeTab)!.icon;
                                return <Icon className="h-12 w-12 sm:h-14 sm:w-14" />;
                              })()}
                            </div>
                          )}
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                          Ready to Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">
                          Click the button below to generate AI-powered {activeTab} from {selectedFileIds.size} selected file{selectedFileIds.size !== 1 ? 's' : ''}.
                        </p>
                        <button
                          onClick={() => generateMutation.mutate({ type: activeTab, refresh: false })}
                          disabled={isGenerating}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-fuchsia-600 dark:from-cyan-500 dark:to-violet-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/30 dark:shadow-cyan-500/30"
                        >
                          <Sparkles className="h-5 w-5" />
                          Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </button>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab + '-content'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <div className="max-w-5xl mx-auto px-1.5 py-3 sm:px-6 sm:py-6 lg:px-8">
                      <div className="relative rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/30 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/[0.02] via-transparent to-fuchsia-500/[0.02] dark:from-cyan-500/[0.02] dark:via-transparent dark:to-violet-500/[0.02] pointer-events-none" />
                        <div className="relative z-10 p-3 sm:p-6 lg:p-8">
                          {/* Book-style page navigation for summary/notes */}
                          {(activeTab === 'summary' || activeTab === 'notes') && studyContent.result.pages && studyContent.result.pages.length > 1 && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-5 sm:mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
                              <button
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-pink-600 dark:hover:text-cyan-400"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Previous</span>
                              </button>

                              <div className="w-full sm:w-auto flex items-center justify-center gap-2 min-w-0">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-xs">
                                  {studyContent.result.pages[currentPage]?.fileName || `File ${currentPage + 1}`}
                                </span>
                                <div className="hidden sm:flex items-center gap-1">
                                  {studyContent.result.pages.map((_: any, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={() => setCurrentPage(idx)}
                                      className={`w-2 h-2 rounded-full transition-all ${
                                        idx === currentPage
                                          ? 'bg-pink-500 dark:bg-cyan-400 scale-125'
                                          : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                                      }`}
                                      title={studyContent.result.pages[idx]?.fileName}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                  {currentPage + 1} / {studyContent.result.pages.length}
                                </span>
                              </div>

                              <button
                                onClick={() => setCurrentPage(p => Math.min(studyContent.result.pages.length - 1, p + 1))}
                                disabled={currentPage === studyContent.result.pages.length - 1}
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-pink-600 dark:hover:text-cyan-400"
                              >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {activeTab === 'summary' && studyContent.result.pages && (
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`summary-page-${currentPage}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                              >
                                <SummaryView
                                  content={(() => {
                                    const pages = studyContent.result.pages;
                                    if (pages.length === 1) return `## ${pages[0].fileName}\n\n${pages[0].content}`;
                                    const page = pages[currentPage];
                                    return page ? page.content : '';
                                  })()}
                                  onRegenerate={handleRegenerate}
                                  isRegenerating={generateMutation.isPending}
                                />
                              </motion.div>
                            </AnimatePresence>
                          )}
                          {activeTab === 'notes' && studyContent.result.pages && (
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`notes-page-${currentPage}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                              >
                                <NotesView
                                  keyPoints={(() => {
                                    const pages = studyContent.result.pages;
                                    if (pages.length === 1) return pages[0].keyPoints || [];
                                    const page = pages[currentPage];
                                    return page?.keyPoints || [];
                                  })()}
                                  detailed={(() => {
                                    const pages = studyContent.result.pages;
                                    if (pages.length === 1) return `## ${pages[0].fileName}\n\n${pages[0].detailed || ''}`;
                                    const page = pages[currentPage];
                                    return page?.detailed || '';
                                  })()}
                                  onRegenerate={handleRegenerate}
                                  isRegenerating={generateMutation.isPending}
                                />
                              </motion.div>
                            </AnimatePresence>
                          )}
                          {activeTab === 'quiz' && studyContent.result.questions && (
                            <QuizPlayer
                              quizId={`course-${courseId}-quiz`}
                              title={course?.title || 'Course Quiz'}
                              questions={studyContent.result.questions.map((q: any, i: number) => ({
                                ...q,
                                id: q.id || `q-${i}`,
                                order: q.order ?? i,
                              }))}
                              onGenerateQuiz={(_difficulty: string, _numQuestions: number) => {
                                generateMutation.mutate({ type: 'quiz', refresh: true });
                              }}
                              isGenerating={generateMutation.isPending}
                              onSubmit={handleQuizSubmit}
                            />
                          )}
                          {activeTab === 'flashcards' && studyContent.result.cards && (
                            <FlashcardViewer
                              cards={studyContent.result.cards.map((c: any, i: number) => ({
                                ...c,
                                id: c.id || `card-${i}`,
                                order: c.order ?? i,
                              }))}
                              title={studyContent.result.title || 'Flashcards'}
                              onRegenerate={handleRegenerate}
                              isRegenerating={generateMutation.isPending}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Keyboard Hints */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="hidden lg:flex items-center justify-center gap-4 pb-6 text-xs text-slate-500 dark:text-slate-500"
                    >
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">A</kbd>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">D</kbd>
                        <span>Switch tabs</span>
                      </span>
                      {totalPages > 1 && (
                        <span className="flex items-center gap-1.5">
                          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">&larr;</kbd>
                          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">&rarr;</kbd>
                          <span>Flip pages</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">Esc</kbd>
                        <span>Exit</span>
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
