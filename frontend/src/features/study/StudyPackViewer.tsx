import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Layers,
  Share2,
  Edit2,
  Save,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Volume2,
  ListMusic,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTTS } from '@/contexts/TTSContext';

type ViewerTab = 'summary' | 'notes' | 'quiz' | 'flashcards';

interface PageContent {
  pageNumber: number;
  heading: string;
  content: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
  difficulty: string;
}

interface FlashcardData {
  title: string;
  cards: { front: string; back: string }[];
}

interface StudyPack {
  id: string;
  title: string;
  courseId: string | null;
  courseTitle: string | null;
  fileIds: string[];
  pages: PageContent[];
  quiz: QuizData | null;
  cards: FlashcardData | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudyPackViewerProps {
  studyPackId: string;
  onClose: () => void;
}

const TABS: { id: ViewerTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'summary', label: 'Summary', icon: BookOpen },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
];

// Animation variants for tab content
const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

export default function StudyPackViewer({ studyPackId, onClose }: StudyPackViewerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { play, addToQueue, currentTrack, isPlaying, isLoading: ttsLoading } = useTTS();

  const [activeTab, setActiveTab] = useState<ViewerTab>('summary');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Flashcard state
  const [currentCard, setCurrentCard] = useState(0);
  const [showCardBack, setShowCardBack] = useState(false);

  // Fetch study pack
  const {
    data: studyPack,
    isLoading,
    error,
  } = useQuery<StudyPack>({
    queryKey: ['study-pack', studyPackId],
    queryFn: async () => {
      const response = await api.get(`/ai/study-pack/${studyPackId}`);
      return response.data;
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      generateShareToken?: boolean;
      removeShareToken?: boolean;
    }) => {
      const response = await api.patch(`/ai/study-pack/${studyPackId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-pack', studyPackId] });
      toast.success('Study pack updated!');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/ai/study-pack/${studyPackId}`);
    },
    onSuccess: () => {
      toast.success('Study pack deleted');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete');
    },
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'summary' && studyPack?.pages) {
        if (e.key === 'ArrowLeft') {
          setCurrentPage((p) => Math.max(0, p - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentPage((p) => Math.min(studyPack.pages.length - 1, p + 1));
        }
      } else if (activeTab === 'flashcards' && studyPack?.cards?.cards) {
        if (e.key === 'ArrowLeft') {
          setCurrentCard((c) => Math.max(0, c - 1));
          setShowCardBack(false);
        } else if (e.key === 'ArrowRight') {
          setCurrentCard((c) => Math.min(studyPack.cards!.cards.length - 1, c + 1));
          setShowCardBack(false);
        } else if (e.key === ' ') {
          e.preventDefault();
          setShowCardBack((b) => !b);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, studyPack]);

  useEffect(() => {
    if (studyPack) {
      setEditTitle(studyPack.title);
    }
  }, [studyPack]);

  const canShare = user?.role === 'PREMIUM' || user?.role === 'ADMIN';

  const handleShare = async () => {
    if (studyPack?.shareToken) {
      // Copy existing share link
      const shareUrl = `${window.location.origin}/study-pack/shared/${studyPack.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied!');
    } else {
      // Generate share token
      updateMutation.mutate({ generateShareToken: true });
    }
  };

  const getQuizScore = useCallback(() => {
    if (!studyPack?.quiz) return { correct: 0, total: 0 };
    const questions = studyPack.quiz.questions;
    let correct = 0;
    questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctAnswer) correct++;
    });
    return { correct, total: questions.length };
  }, [studyPack, quizAnswers]);

  // Progress bar for summary
  const pageProgress = studyPack?.pages ? ((currentPage + 1) / studyPack.pages.length) * 100 : 0;

  const renderSummaryTab = () => {
    if (!studyPack?.pages || studyPack.pages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No content available</p>
        </div>
      );
    }

    const page = studyPack.pages[currentPage];

    // Check if current page is playing
    const isCurrentPagePlaying =
      currentTrack?.studyPackId === studyPackId && currentTrack?.pageNumber === currentPage;

    // Handler for reading current page
    const handleReadPage = () => {
      const textToRead = page.heading ? `${page.heading}. ${page.content}` : page.content;

      play({
        id: `${studyPackId}-page-${currentPage}`,
        title: page.heading || `Page ${currentPage + 1}`,
        text: textToRead,
        studyPackId,
        pageNumber: currentPage,
      });
    };

    // Handler for reading all pages from current
    const handleReadAllPages = () => {
      const tracks = studyPack.pages.slice(currentPage).map((p, idx) => ({
        id: `${studyPackId}-page-${currentPage + idx}`,
        title: p.heading || `Page ${currentPage + idx + 1}`,
        text: p.heading ? `${p.heading}. ${p.content}` : p.content,
        studyPackId,
        pageNumber: currentPage + idx,
      }));

      // Play the first track immediately
      if (tracks.length > 0) {
        play(tracks[0]);
        // Queue the rest
        if (tracks.length > 1) {
          addToQueue(tracks.slice(1));
          toast.success(`Queued ${tracks.length - 1} more pages`);
        }
      }
    };

    return (
      <div className="flex flex-col h-full">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${pageProgress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* TTS Controls */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={handleReadPage}
            disabled={ttsLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isCurrentPagePlaying
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 text-primary-700 dark:text-primary-300 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30'
            }`}
          >
            <Volume2
              className={`h-4 w-4 ${isCurrentPagePlaying && isPlaying ? 'animate-pulse' : ''}`}
            />
            {isCurrentPagePlaying ? 'Playing...' : 'Read This Page'}
          </button>

          {studyPack.pages.length > 1 && (
            <button
              onClick={handleReadAllPages}
              disabled={ttsLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-sm font-medium transition-colors"
            >
              <ListMusic className="h-4 w-4" />
              Read All ({studyPack.pages.length - currentPage} pages)
            </button>
          )}
        </div>

        {/* Page content - Card-based academic design */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
          >
            {page.heading && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                {page.heading}
              </h2>
            )}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-[1.8] text-base">
                {page.content}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Page {currentPage + 1} of {studyPack.pages.length}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(studyPack.pages.length - 1, p + 1))}
            disabled={currentPage === studyPack.pages.length - 1}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Page dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {studyPack.pages.slice(0, Math.min(20, studyPack.pages.length)).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentPage
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          ))}
          {studyPack.pages.length > 20 && (
            <span className="text-xs text-gray-500">+{studyPack.pages.length - 20}</span>
          )}
        </div>
      </div>
    );
  };

  // Notes tab - shows key points and summary in card layout
  const renderNotesTab = () => {
    if (!studyPack?.pages || studyPack.pages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No notes available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {studyPack.pages.map((page, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
          >
            {page.heading && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {page.heading}
              </h3>
            )}
            <p className="text-gray-600 dark:text-gray-300 leading-[1.7] text-sm line-clamp-4">
              {page.content}
            </p>
            <button
              onClick={() => {
                setActiveTab('summary');
                setCurrentPage(index);
              }}
              className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Read full page →
            </button>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderQuizTab = () => {
    if (!studyPack?.quiz) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <HelpCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No quiz available</p>
        </div>
      );
    }

    const { correct, total } = getQuizScore();

    return (
      <div className="space-y-6">
        {/* Quiz header card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {studyPack.quiz.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {studyPack.quiz.questions.length} questions • {studyPack.quiz.difficulty} difficulty
              </p>
            </div>
            {showQuizResults && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-4 py-2 rounded-xl font-semibold ${
                  correct === total
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : correct >= total / 2
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                Score: {correct}/{total}
              </motion.div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {studyPack.quiz.questions.map((question, qIndex) => (
            <motion.div
              key={qIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: qIndex * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
            >
              <p className="font-medium text-gray-900 dark:text-white mb-4 leading-relaxed">
                {qIndex + 1}. {question.question}
              </p>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => {
                  const isSelected = quizAnswers[qIndex] === option;
                  const isCorrect = question.correctAnswer === option;
                  const showResult = showQuizResults;

                  return (
                    <button
                      key={oIndex}
                      onClick={() => {
                        if (!showQuizResults) {
                          setQuizAnswers({ ...quizAnswers, [qIndex]: option });
                        }
                      }}
                      disabled={showQuizResults}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                        showResult
                          ? isCorrect
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                            : isSelected
                              ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-100 dark:border-slate-600'
                          : isSelected
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-100 dark:border-slate-600 hover:border-gray-200 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {showResult && isCorrect && <Check className="h-4 w-4 text-green-500" />}
                        {showResult && isSelected && !isCorrect && (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {showQuizResults && question.explanation && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg"
                >
                  💡 {question.explanation}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>

        {!showQuizResults ? (
          <button
            onClick={() => setShowQuizResults(true)}
            disabled={Object.keys(quizAnswers).length !== studyPack.quiz!.questions.length}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            Check Answers ({Object.keys(quizAnswers).length}/{studyPack.quiz.questions.length}{' '}
            answered)
          </button>
        ) : (
          <button
            onClick={() => {
              setQuizAnswers({});
              setShowQuizResults(false);
            }}
            className="w-full py-3.5 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    );
  };

  const renderFlashcardsTab = () => {
    if (!studyPack?.cards || !studyPack.cards.cards?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Layers className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No flashcards available</p>
        </div>
      );
    }

    const cards = studyPack.cards.cards;
    const card = cards[currentCard];

    return (
      <div className="space-y-6">
        {/* Header card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {studyPack.cards.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Card {currentCard + 1} of {cards.length}
              </p>
            </div>
          </div>
        </div>

        {/* Flashcard - with flip animation */}
        <motion.div
          key={`${currentCard}-${showCardBack}`}
          initial={{ opacity: 0, rotateY: showCardBack ? -10 : 10 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setShowCardBack(!showCardBack)}
          className="min-h-[280px] p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer transition-all hover:shadow-md flex items-center justify-center text-center"
        >
          <div className="max-w-lg">
            <p className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4 font-medium">
              {showCardBack ? 'Answer' : 'Question'}
            </p>
            <p className="text-xl text-gray-900 dark:text-white leading-[1.7]">
              {showCardBack ? card.back : card.front}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">
              {showCardBack ? 'Click to see question' : 'Click to reveal answer'} • Space to flip
            </p>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentCard(Math.max(0, currentCard - 1));
              setShowCardBack(false);
            }}
            disabled={currentCard === 0}
            className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {cards.slice(0, Math.min(15, cards.length)).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentCard(i);
                  setShowCardBack(false);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentCard
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
            {cards.length > 15 && (
              <span className="text-xs text-gray-500">+{cards.length - 15}</span>
            )}
          </div>

          <button
            onClick={() => {
              setCurrentCard(Math.min(cards.length - 1, currentCard + 1));
              setShowCardBack(false);
            }}
            disabled={currentCard === cards.length - 1}
            className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg"
        >
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-center">Loading study pack...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !studyPack) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center shadow-lg"
        >
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load study pack</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm ${isFullscreen ? 'p-0' : 'p-4'}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-gray-50 dark:bg-slate-900 shadow-xl flex flex-col overflow-hidden transition-all ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[90vh] rounded-2xl'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => updateMutation.mutate({ title: editTitle })}
                  className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(studyPack.title);
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <BookOpen className="h-6 w-6 text-primary-500 flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {studyPack.title}
                  </h2>
                  {studyPack.courseTitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {studyPack.courseTitle}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Rename"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {canShare && (
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title={studyPack.shareToken ? 'Copy share link' : 'Generate share link'}
                  >
                    {studyPack.shareToken ? (
                      <Copy className="h-4 w-4" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Delete this study pack?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs - with smooth indicator */}
        <div className="flex bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex-shrink-0 px-2">
          {TABS.map((tab) => {
            const hasContent =
              tab.id === 'summary' || tab.id === 'notes'
                ? !!studyPack.pages?.length
                : tab.id === 'quiz'
                  ? !!studyPack.quiz
                  : !!studyPack.cards?.cards?.length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!hasContent}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : hasContent
                      ? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {!hasContent && <span className="text-xs">(empty)</span>}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeStudyTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content with tab transitions */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {activeTab === 'summary' && renderSummaryTab()}
              {activeTab === 'notes' && renderNotesTab()}
              {activeTab === 'quiz' && renderQuizTab()}
              {activeTab === 'flashcards' && renderFlashcardsTab()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{studyPack.fileIds.length} file{studyPack.fileIds.length !== 1 ? 's' : ''} combined</span>
          <span>Use ← → arrows to navigate</span>
        </div>
      </motion.div>
    </div>
  );
}
