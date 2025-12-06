import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  FileText,
  BookOpen,
  HelpCircle,
  Layers,
  RefreshCw,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

type AITab = 'summary' | 'notes' | 'quiz' | 'flashcards';

interface FileAIViewerProps {
  fileId: string;
  fileName: string;
  courseTitle: string;
  initialTab?: AITab;
  onClose: () => void;
}

interface SummaryData {
  content: string;
}

interface NotesData {
  keyPoints: string[];
  detailed: string;
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
  difficulty?: string;
}

interface FlashcardData {
  title: string;
  cards: { front: string; back: string }[];
}

interface AIContentResponse {
  fileId: string;
  fileName: string;
  fileType: string;
  isAICompatible: boolean;
  summary: SummaryData | null;
  summaryGeneratedAt: string | null;
  notes: NotesData | null;
  notesGeneratedAt: string | null;
  quiz: QuizData | null;
  quizGeneratedAt: string | null;
  cards: FlashcardData | null;
  cardsGeneratedAt: string | null;
}

const TABS: { id: AITab; label: string; icon: typeof FileText }[] = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FileAIViewer({
  fileId,
  fileName,
  courseTitle,
  initialTab = 'summary',
  onClose,
}: FileAIViewerProps) {
  const [activeTab, setActiveTab] = useState<AITab>(initialTab);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing AI content
  const {
    data: aiContent,
    isLoading: loadingContent,
    error: contentError,
  } = useQuery<AIContentResponse>({
    queryKey: ['file-ai', fileId],
    queryFn: async () => {
      const response = await api.get(`/ai/file/${fileId}`);
      return response.data;
    },
  });

  // Generate mutations for each content type
  const generateSummary = useMutation({
    mutationFn: async (refresh: boolean = false) => {
      const response = await api.post(
        `/ai/file/${fileId}/summary${refresh ? '?refresh=true' : ''}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-ai', fileId] });
      toast.success('Summary generated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate summary');
    },
  });

  const generateNotes = useMutation({
    mutationFn: async (refresh: boolean = false) => {
      const response = await api.post(`/ai/file/${fileId}/notes${refresh ? '?refresh=true' : ''}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-ai', fileId] });
      toast.success('Notes generated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate notes');
    },
  });

  const generateQuiz = useMutation({
    mutationFn: async ({
      refresh = false,
      difficulty = 'MEDIUM',
      count = 10,
    }: {
      refresh?: boolean;
      difficulty?: string;
      count?: number;
    }) => {
      const response = await api.post(
        `/ai/file/${fileId}/quiz?refresh=${refresh}&difficulty=${difficulty}&count=${count}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-ai', fileId] });
      setQuizAnswers({});
      setShowQuizResults(false);
      toast.success('Quiz generated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate quiz');
    },
  });

  const generateFlashcards = useMutation({
    mutationFn: async ({ refresh = false, count = 15 }: { refresh?: boolean; count?: number }) => {
      const response = await api.post(
        `/ai/file/${fileId}/flashcards?refresh=${refresh}&count=${count}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-ai', fileId] });
      setCurrentFlashcard(0);
      setShowFlashcardBack(false);
      toast.success('Flashcards generated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate flashcards');
    },
  });

  // Auto-generate content when tab changes and no content exists
  useEffect(() => {
    if (!aiContent) return;

    if (activeTab === 'summary' && !aiContent.summary && !generateSummary.isPending) {
      generateSummary.mutate(false);
    } else if (activeTab === 'notes' && !aiContent.notes && !generateNotes.isPending) {
      generateNotes.mutate(false);
    } else if (activeTab === 'quiz' && !aiContent.quiz && !generateQuiz.isPending) {
      generateQuiz.mutate({ refresh: false });
    } else if (activeTab === 'flashcards' && !aiContent.cards && !generateFlashcards.isPending) {
      generateFlashcards.mutate({ refresh: false });
    }
  }, [activeTab, aiContent]);

  const isGenerating =
    generateSummary.isPending ||
    generateNotes.isPending ||
    generateQuiz.isPending ||
    generateFlashcards.isPending;

  const handleRegenerate = () => {
    if (!confirm('This will regenerate the content. Continue?')) return;

    switch (activeTab) {
      case 'summary':
        generateSummary.mutate(true);
        break;
      case 'notes':
        generateNotes.mutate(true);
        break;
      case 'quiz':
        generateQuiz.mutate({ refresh: true });
        break;
      case 'flashcards':
        generateFlashcards.mutate({ refresh: true });
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getQuizScore = () => {
    if (!aiContent?.quiz) return { correct: 0, total: 0 };
    const questions = aiContent.quiz.questions;
    let correct = 0;
    questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctAnswer) correct++;
    });
    return { correct, total: questions.length };
  };

  const renderSummaryTab = () => {
    if (generateSummary.isPending) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating summary...</p>
        </div>
      );
    }

    if (!aiContent?.summary) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No summary generated yet</p>
          <button
            onClick={() => generateSummary.mutate(false)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Generate Summary
          </button>
        </div>
      );
    }

    return (
      <div className="prose dark:prose-invert max-w-none">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Generated {formatDate(aiContent.summaryGeneratedAt)}</span>
          </div>
          <button
            onClick={() => copyToClipboard(aiContent.summary!.content)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
        </div>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {aiContent.summary.content}
        </p>
      </div>
    );
  };

  const renderNotesTab = () => {
    if (generateNotes.isPending) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating notes...</p>
        </div>
      );
    }

    if (!aiContent?.notes) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No notes generated yet</p>
          <button
            onClick={() => generateNotes.mutate(false)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Generate Notes
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Generated {formatDate(aiContent.notesGeneratedAt)}</span>
          </div>
        </div>

        {/* Key Points */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Points</h3>
          <ul className="space-y-2">
            {aiContent.notes.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <ChevronRight className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Detailed Notes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Detailed Notes
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {aiContent.notes.detailed}
          </p>
        </div>
      </div>
    );
  };

  const renderQuizTab = () => {
    if (generateQuiz.isPending) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating quiz...</p>
        </div>
      );
    }

    if (!aiContent?.quiz) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <HelpCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No quiz generated yet</p>
          <button
            onClick={() => generateQuiz.mutate({ refresh: false })}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Generate Quiz
          </button>
        </div>
      );
    }

    const { correct, total } = getQuizScore();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {aiContent.quiz.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {aiContent.quiz.questions.length} questions • {aiContent.quiz.difficulty || 'MEDIUM'}{' '}
              difficulty
            </p>
          </div>
          {showQuizResults && (
            <div
              className={`px-4 py-2 rounded-lg font-semibold ${
                correct === total
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : correct >= total / 2
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              Score: {correct}/{total}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {aiContent.quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-medium text-gray-900 dark:text-white mb-3">
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
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        showResult
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : isSelected
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-200 dark:border-gray-600'
                          : isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
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
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                  💡 {question.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        {!showQuizResults ? (
          <button
            onClick={() => setShowQuizResults(true)}
            disabled={Object.keys(quizAnswers).length !== aiContent.quiz!.questions.length}
            className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Check Answers ({Object.keys(quizAnswers).length}/{aiContent.quiz.questions.length}{' '}
            answered)
          </button>
        ) : (
          <button
            onClick={() => {
              setQuizAnswers({});
              setShowQuizResults(false);
            }}
            className="w-full py-3 border-2 border-primary-500 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  };

  const renderFlashcardsTab = () => {
    if (generateFlashcards.isPending) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating flashcards...</p>
        </div>
      );
    }

    if (!aiContent?.cards || !aiContent.cards.cards?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Layers className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No flashcards generated yet</p>
          <button
            onClick={() => generateFlashcards.mutate({ refresh: false })}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Generate Flashcards
          </button>
        </div>
      );
    }

    const cards = aiContent.cards.cards;
    const currentCard = cards[currentFlashcard];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {aiContent.cards.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Card {currentFlashcard + 1} of {cards.length}
            </p>
          </div>
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setShowFlashcardBack(!showFlashcardBack)}
          className="min-h-[200px] p-8 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl cursor-pointer transition-all hover:shadow-lg flex items-center justify-center text-center"
        >
          <div>
            <p className="text-xs uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-2">
              {showFlashcardBack ? 'Answer' : 'Question'}
            </p>
            <p className="text-xl text-gray-900 dark:text-white">
              {showFlashcardBack ? currentCard.back : currentCard.front}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Click to {showFlashcardBack ? 'see question' : 'reveal answer'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentFlashcard(Math.max(0, currentFlashcard - 1));
              setShowFlashcardBack(false);
            }}
            disabled={currentFlashcard === 0}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {cards.slice(0, Math.min(10, cards.length)).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentFlashcard(i);
                  setShowFlashcardBack(false);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentFlashcard
                    ? 'bg-primary-500'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
            {cards.length > 10 && (
              <span className="text-xs text-gray-500">+{cards.length - 10}</span>
            )}
          </div>

          <button
            onClick={() => {
              setCurrentFlashcard(Math.min(cards.length - 1, currentFlashcard + 1));
              setShowFlashcardBack(false);
            }}
            disabled={currentFlashcard === cards.length - 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {fileName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{courseTitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Regenerate"
            >
              <RefreshCw className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingContent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : contentError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Failed to load AI content</p>
            </div>
          ) : !aiContent?.isAICompatible ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                AI features are not available for this file type.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Supported: PDF, DOCX, TXT, PPTX
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'summary' && renderSummaryTab()}
              {activeTab === 'notes' && renderNotesTab()}
              {activeTab === 'quiz' && renderQuizTab()}
              {activeTab === 'flashcards' && renderFlashcardsTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
