import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, User } from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SummaryView from '@/features/study/SummaryView';
import NotesView from '@/features/study/NotesView';
import FlashcardViewer from '@/features/study/FlashcardViewer';
import QuizPlayer from '@/features/study/QuizPlayer';
import { useStudySession } from '@/hooks/useStudySession';

type TabType = 'summary' | 'notes' | 'flashcards' | 'quizzes';

interface CourseLesson {
  id: string;
  title: string;
  order: number;
  file: {
    id: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    status: string;
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
  };
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);

  // Use the unified study session hook
  const {
    activeTab,
    selectedQuiz,
    selectedFlashcardSet,
    numQuestions,
    quizDifficulty,
    numCards,
    setActiveTab,
    setSelectedQuiz,
    setSelectedFlashcardSet,
    setNumQuestions,
    setQuizDifficulty,
    setNumCards,
    generateSummaryMutation,
    generateNotesMutation,
    generateQuizMutation,
    generateFlashcardsMutation,
    submitQuizMutation,
  } = useStudySession({ 
    queryKey: ['course', slug as string],
    fileSource: 'course'
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const response = await api.get(`/courses/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderTabContent = () => {
    if (!selectedLesson || selectedLesson.file.status !== 'COMPLETED') {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>File processing failed or not yet complete</p>
        </div>
      );
    }

    const file = selectedLesson.file;

    switch (activeTab) {
      case 'summary':
        if (file.summary) {
          return <SummaryView content={file.summary.content} />;
        }
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No summary generated yet</p>
            <button
              onClick={() => generateSummaryMutation.mutate({ fileId: file.id })}
              disabled={generateSummaryMutation.isPending}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {generateSummaryMutation.isPending ? 'Generating...' : 'Generate Summary'}
            </button>
          </div>
        );

      case 'notes':
        if (file.notes) {
          return <NotesView keyPoints={file.notes.keyPoints} detailed={file.notes.detailed} />;
        }
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No notes generated yet</p>
            <button
              onClick={() => generateNotesMutation.mutate({ fileId: file.id })}
              disabled={generateNotesMutation.isPending}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {generateNotesMutation.isPending ? 'Generating...' : 'Generate Notes'}
            </button>
          </div>
        );

      case 'flashcards':
        if (selectedFlashcardSet || (file.flashcardSets && file.flashcardSets.length > 0)) {
          const set = selectedFlashcardSet || file.flashcardSets![0];
          return <FlashcardViewer cards={set.cards} title={set.title} />;
        }
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No flashcards yet</p>
            <div className="max-w-xs mx-auto mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              onClick={() => generateFlashcardsMutation.mutate({ fileId: file.id, numCards })}
              disabled={generateFlashcardsMutation.isPending}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {generateFlashcardsMutation.isPending ? 'Generating...' : 'Generate Flashcards'}
            </button>
          </div>
        );

      case 'quizzes':
        if (selectedQuiz) {
          return (
            <div>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="mb-4 text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                ← Back
              </button>
              <QuizPlayer
                quizId={selectedQuiz.id}
                title={selectedQuiz.title}
                questions={selectedQuiz.questions}
                onSubmit={(answers) =>
                  submitQuizMutation.mutateAsync({ quizId: selectedQuiz.id, answers })
                }
              />
            </div>
          );
        }

        if (file.quizzes && file.quizzes.length > 0) {
          return (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Your Quizzes</h3>
              {file.quizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedQuiz(quiz)}
                  className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white transition-colors"
                >
                  {quiz.title} • {quiz.questions.length} questions
                </button>
              ))}
              <div className="pt-4 border-t dark:border-gray-600 text-center">
                <p className="mb-4 text-gray-900 dark:text-white">Generate new quiz</p>
                <div className="max-w-xs mx-auto space-y-4 mb-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-900 dark:text-white">
                      Questions
                    </label>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setNumQuestions(Math.max(10, numQuestions - 5))}
                        disabled={numQuestions <= 10}
                        className="w-10 h-10 rounded-lg font-bold text-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-xl font-bold text-gray-900 dark:text-white">
                        {numQuestions}
                      </span>
                      <button
                        onClick={() => setNumQuestions(Math.min(25, numQuestions + 5))}
                        disabled={numQuestions >= 25}
                        className="w-10 h-10 rounded-lg font-bold text-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">10–25 questions</p>
                  </div>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    generateQuizMutation.mutate({
                      fileId: file.id,
                      numQuestions,
                      difficulty: quizDifficulty,
                    })
                  }
                  disabled={generateQuizMutation.isPending}
                  className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
                </button>
                {generateQuizMutation.isError && (
                  <p className="mt-3 text-red-500 dark:text-red-400 text-sm">
                    {generateQuizMutation.error?.message || 'Failed to generate quiz. The file may not have enough content.'}
                  </p>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No quizzes yet</p>
            <div className="max-w-xs mx-auto space-y-4 mb-4">
              <div>
                <label className="block text-sm mb-2 text-gray-900 dark:text-white">
                  Questions
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setNumQuestions(Math.max(10, numQuestions - 5))}
                    disabled={numQuestions <= 10}
                    className="w-10 h-10 rounded-lg font-bold text-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-xl font-bold text-gray-900 dark:text-white">
                    {numQuestions}
                  </span>
                  <button
                    onClick={() => setNumQuestions(Math.min(25, numQuestions + 5))}
                    disabled={numQuestions >= 25}
                    className="w-10 h-10 rounded-lg font-bold text-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">10–25 questions</p>
              </div>
              <select
                value={quizDifficulty}
                onChange={(e) => setQuizDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <button
              onClick={() =>
                generateQuizMutation.mutate({
                  fileId: file.id,
                  numQuestions,
                  difficulty: quizDifficulty,
                })
              }
              disabled={generateQuizMutation.isPending}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
            </button>
            {generateQuizMutation.isError && (
              <p className="mt-3 text-red-500 dark:text-red-400 text-sm">
                {generateQuizMutation.error?.message || 'Failed to generate quiz. The file may not have enough content.'}
              </p>
            )}
          </div>
        );
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load course</p>
        </div>
      </div>
    );
  }

  const course = data?.course;

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-app bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-8 lg:px-16">
        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {course.bannerImage && (
            <div className="relative h-48">
              <img
                src={course.bannerImage}
                alt={course.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>{course.lessonsCount} lessons</span>
              </div>
              {course.creator?.name && (
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>{course.creator.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Study Interface */}
        {course.lessons && course.lessons.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lessons Sidebar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Course Lessons</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {course.lessons.length} lessons
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {course.lessons.map((lesson: CourseLesson, index: number) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setSelectedQuiz(null);
                      setSelectedFlashcardSet(null);
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Minimal number badge */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {lesson.title}
                        </p>
                        {lesson.file && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatFileSize(lesson.file.fileSize)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Study Content */}
            <div className="lg:col-span-2">
              {!selectedLesson ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    No lesson selected
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Select a lesson to start studying
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedLesson.title}
                    </h2>
                    {selectedLesson.file && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedLesson.file.originalName}
                      </p>
                    )}
                  </div>
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
                      {(['summary', 'notes', 'flashcards', 'quizzes'] as TabType[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => {
                            setActiveTab(tab);
                            setSelectedQuiz(null);
                            setSelectedFlashcardSet(null);
                          }}
                          className={`py-3 sm:py-4 border-b-2 capitalize transition-colors whitespace-nowrap text-sm sm:text-base ${
                            activeTab === tab
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-6">{renderTabContent()}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No lessons available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
