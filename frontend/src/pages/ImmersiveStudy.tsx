/**
 * ImmersiveStudy Page - Focused File Study Interface
 * Displays AI-powered study tools for a specific file in an immersive view
 * Accessed ONLY via /study/:fileId
 * This component MUST have a fileId param - if not, it redirects to /study
 */

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import SummaryView from '@/features/study/SummaryView';
import NotesView from '@/features/study/NotesView';
import FlashcardViewer from '@/features/study/FlashcardViewer';
import QuizPlayer from '@/features/study/QuizPlayer';
import { useStudySession } from '@/hooks/useStudySession';
import GenerationModal from '@/components/modals/GenerationModal';
import api from '@/lib/api';
import { useLayout } from '@/contexts/LayoutContext';

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

export default function ImmersiveStudy() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fileId } = useParams<{ fileId: string }>();
  const { setHideSidebar, setCustomHeaderContent } = useLayout();

  // CRITICAL GUARD: This component should ONLY render for /study/:fileId routes
  // If we're on any other route, something is wrong with the routing
  const isCorrectRoute = useMemo(() => {
    return location.pathname.startsWith('/study/') && fileId;
  }, [location.pathname, fileId]);

  // Immediate redirect if on wrong route
  useEffect(() => {
    if (!isCorrectRoute) {
      setHideSidebar(false);
      setCustomHeaderContent(null);
      if (location.pathname === '/study') {
        // Already on correct route, do nothing
      } else if (!fileId) {
        navigate('/study', { replace: true });
      }
    }
  }, [isCorrectRoute, fileId, location.pathname, navigate, setHideSidebar, setCustomHeaderContent]);

  // Early return if not on correct route
  if (!isCorrectRoute) {
    return null;
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
        // File not found, redirect to study home
        navigate('/study', { replace: true });
      }
    }
  }, [fileId, files, selectedFile?.id, setSelectedFile, navigate]);

  // CRITICAL: Single effect to manage ALL layout changes with proper cleanup
  useEffect(() => {
    // Only proceed if we have a valid fileId
    if (!fileId) {
      navigate('/study', { replace: true });
      return;
    }

    // Set sidebar hidden immediately
    setHideSidebar(true);
    
    // MANDATORY cleanup function - runs before re-render and on unmount
    return () => {
      setHideSidebar(false);
      setCustomHeaderContent(null);
    };
  }, [fileId, setHideSidebar, setCustomHeaderContent, navigate]);

  // Separate effect for header content that updates based on selectedFile and activeTab
  useEffect(() => {
    if (!fileId || !selectedFile) {
      return;
    }

    setCustomHeaderContent(
      <>
        {/* Back Button + File Info */}
        <button
          onClick={() => window.location.href = '/study'}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="min-w-0 hidden sm:block">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {selectedFile.originalName}
          </h2>
        </div>
        
        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {(['summary', 'notes', 'flashcards', 'quizzes'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedFlashcardSet(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'flashcards' ? 'Cards' : tab}
            </button>
          ))}
        </div>
      </>
    );
    
    // Cleanup when fileId or selectedFile changes
    return () => {
      setCustomHeaderContent(null);
    };
  }, [fileId, selectedFile, activeTab, setCustomHeaderContent, setActiveTab, setSelectedFlashcardSet, navigate]);

  const renderTabContent = () => {
    if (!selectedFile || selectedFile.status !== 'COMPLETED') {
      return (
        <div className="text-center py-12 text-slate-600 dark:text-slate-300">
          <p>File processing failed or not yet complete</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'summary':
        if (selectedFile.summary) {
          return (
            <SummaryView
              content={selectedFile.summary.content}
              onRegenerate={() =>
                generateSummaryMutation.mutate({ fileId: selectedFile.id, regenerate: true })
              }
              isRegenerating={generateSummaryMutation.isPending}
            />
          );
        }
        return (
          <div className="text-center py-12 space-y-6">
            {!generateSummaryMutation.isPending && (
              <>
                <p className="text-slate-600 dark:text-slate-400 mb-4">No summary generated yet</p>
                <button
                  onClick={() => generateSummaryMutation.mutate({ fileId: selectedFile.id })}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-[background-image,box-shadow,transform] duration-200 active:scale-95 shadow-lg hover:shadow-xl"
                  disabled={generateSummaryMutation.isPending}
                >
                  {generateSummaryMutation.isPending ? 'Generating...' : 'Generate Summary'}
                </button>
              </>
            )}
          </div>
        );

      case 'notes':
        if (selectedFile.notes) {
          return (
            <NotesView
              keyPoints={selectedFile.notes.keyPoints}
              detailed={selectedFile.notes.detailed}
              onRegenerate={() =>
                generateNotesMutation.mutate({ fileId: selectedFile.id, regenerate: true })
              }
              isRegenerating={generateNotesMutation.isPending}
            />
          );
        }
        return (
          <div className="text-center py-12 space-y-6">
            {!generateNotesMutation.isPending && (
              <>
                <p className="text-slate-600 dark:text-slate-400 mb-4">No notes generated yet</p>
                <button
                  onClick={() => generateNotesMutation.mutate({ fileId: selectedFile.id })}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-[background-image,box-shadow,transform] duration-200 active:scale-95 shadow-lg hover:shadow-xl"
                  disabled={generateNotesMutation.isPending}
                >
                  {generateNotesMutation.isPending ? 'Generating...' : 'Generate Notes'}
                </button>
              </>
            )}
          </div>
        );

      case 'flashcards':
        if (
          selectedFlashcardSet ||
          (selectedFile.flashcardSets && selectedFile.flashcardSets.length > 0)
        ) {
          const set = selectedFlashcardSet || selectedFile.flashcardSets![0];
          return <FlashcardViewer cards={set.cards} title={set.title} />;
        }
        return (
          <div className="text-center py-12 space-y-6">
            {!generateFlashcardsMutation.isPending && (
              <>
                <p className="text-slate-600 dark:text-slate-400 mb-4">No flashcards yet</p>
                <div className="max-w-xs mx-auto mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Cards: {numCards}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={numCards}
                    onChange={(e) => setNumCards(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={() =>
                    generateFlashcardsMutation.mutate({ fileId: selectedFile.id, numCards })
                  }
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-[background-image,box-shadow,transform] duration-200 active:scale-95 shadow-lg hover:shadow-xl"
                  disabled={generateFlashcardsMutation.isPending}
                >
                  {generateFlashcardsMutation.isPending ? 'Generating...' : 'Generate Flashcards'}
                </button>
              </>
            )}
          </div>
        );

      case 'quizzes':
        return (
          <div>
            <QuizPlayer
              quizId={selectedQuiz?.id || "temp-quiz"}
              title={selectedFile.originalName}
              questions={selectedQuiz?.questions || []}
              fileId={selectedFile.id}
              onGenerateQuiz={(difficulty: string, numQuestions: number) => {
                generateQuizMutation.mutate({ 
                  fileId: selectedFile.id, 
                  difficulty: difficulty.toUpperCase(), 
                  numQuestions 
                });
              }}
              isGenerating={generateQuizMutation.isPending}
              onSubmit={async (answers, timeSpentSeconds, questionTimings) => {
                if (selectedQuiz?.id) {
                  try {
                    console.log('📤 Submitting quiz:', { answers, timeSpentSeconds, questionTimings });
                    const response = await api.post(`/study/quizzes/${selectedQuiz.id}/submit`, {
                      answers,
                      timeSpentSeconds,
                      questionTimings,
                    });
                    
                    console.log('📥 Quiz response:', response.data);
                    console.log('🏆 Achievements in response:', response.data.achievements);
                    
                    // Dispatch achievement notifications
                    if (response.data.achievements && response.data.achievements.length > 0) {
                      console.log('🚀 Dispatching api-notification event with', response.data.achievements.length, 'achievements');
                      window.dispatchEvent(new CustomEvent('api-notification', {
                        detail: { notifications: response.data.achievements }
                      }));
                    } else {
                      console.log('⚠️ No achievements to dispatch');
                    }
                    
                    if (response.data.xpGained > 0) {
                      toast.success(`+${response.data.xpGained} XP earned!`);
                    }
                    
                    return response.data;
                  } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Failed to submit quiz');
                    throw error;
                  }
                } else {
                  const questions = selectedQuiz?.questions || [];
                  let score = 0;
                  questions.forEach((question: any) => {
                    if (answers[question.id] === question.correctAnswer) {
                      score++;
                    }
                  });
                  const total = questions.length;
                  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
                  return { score, total, percentage };
                }
              }}
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Loading file...</p>
        </div>
      </div>
    );
  }

  const getActiveGenerationType = (): 'summary' | 'notes' | 'flashcards' | 'quiz' | null => {
    if (generateSummaryMutation.isPending) return 'summary';
    if (generateNotesMutation.isPending) return 'notes';
    if (generateFlashcardsMutation.isPending) return 'flashcards';
    if (generateQuizMutation.isPending) return 'quiz';
    return null;
  };

  const activeGenerationType = getActiveGenerationType();

  return (
    <>
      <GenerationModal 
        isOpen={activeGenerationType !== null} 
        type={activeGenerationType || 'summary'} 
      />

      <div className="h-full overflow-y-auto">
        {renderTabContent()}
      </div>
    </>
  );
}
