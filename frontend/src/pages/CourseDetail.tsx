import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SummaryView from '../components/study/SummaryView';
import NotesView from '../components/study/NotesView';
import FlashcardViewer from '../components/study/FlashcardViewer';
import QuizPlayer from '../components/study/QuizPlayer';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState<any | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [numCards, setNumCards] = useState(20);

  const getToken = () => localStorage.getItem('accessToken');

  const { data, isLoading, error } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const response = await api.get(`/courses/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });

  // Generate summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/summary`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate summary');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['course', slug] });
      if (selectedLesson) {
        setSelectedLesson({
          ...selectedLesson,
          file: { ...selectedLesson.file, summary: data.summary },
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate summary: ${error.message}`);
    },
  });

  // Generate notes mutation
  const generateNotesMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate notes');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['course', slug] });
      if (selectedLesson) {
        setSelectedLesson({
          ...selectedLesson,
          file: { ...selectedLesson.file, notes: data.notes },
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate notes: ${error.message}`);
    },
  });

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async ({
      fileId,
      numQuestions,
      difficulty,
    }: {
      fileId: string;
      numQuestions: number;
      difficulty: string;
    }) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ numQuestions, difficulty }),
      });
      if (!response.ok) throw new Error('Failed to generate quiz');
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['course', slug] });
      setSelectedQuiz(data.quiz);
      if (selectedLesson) {
        setSelectedLesson({
          ...selectedLesson,
          file: {
            ...selectedLesson.file,
            quizzes: [...(selectedLesson.file.quizzes || []), data.quiz],
          },
        });
      }
    },
  });

  // Generate flashcards mutation
  const generateFlashcardsMutation = useMutation({
    mutationFn: async ({ fileId, numCards }: { fileId: string; numCards: number }) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ numCards }),
      });
      if (!response.ok) throw new Error('Failed to generate flashcards');
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['course', slug] });
      setSelectedFlashcardSet(data.flashcardSet);
      if (selectedLesson) {
        setSelectedLesson({
          ...selectedLesson,
          file: {
            ...selectedLesson.file,
            flashcardSets: [...(selectedLesson.file.flashcardSets || []), data.flashcardSet],
          },
        });
      }
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: Record<string, string>;
    }) => {
      const response = await fetch(`${API_URL}/study/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ answers }),
      });
      if (!response.ok) throw new Error('Failed to submit quiz');
      return response.json();
    },
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
              onClick={() => generateSummaryMutation.mutate(file.id)}
              disabled={generateSummaryMutation.isPending}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
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
              onClick={() => generateNotesMutation.mutate(file.id)}
              disabled={generateNotesMutation.isPending}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
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
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
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
                className="mb-4 text-indigo-600 dark:text-indigo-400 text-sm"
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
                  className="w-full text-left p-4 border dark:border-gray-600 rounded-lg hover:border-indigo-600 dark:hover:border-indigo-400 text-gray-900 dark:text-white"
                >
                  {quiz.title} • {quiz.questions.length} questions
                </button>
              ))}
              <div className="pt-4 border-t dark:border-gray-600 text-center">
                <p className="mb-4 text-gray-900 dark:text-white">Generate new quiz</p>
                <div className="max-w-xs mx-auto space-y-4 mb-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-900 dark:text-white">
                      Questions: {numQuestions}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full"
                    />
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
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
                </button>
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
                  Questions: {numQuestions}
                </label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full"
                />
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
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
            </button>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-8 lg:px-16">
        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden mb-6">
          {course.bannerImage && (
            <div className="relative">
              <img
                src={course.bannerImage}
                alt={course.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Course Lessons</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {course.lessons.length} lessons
                </p>
              </div>
              <div className="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {course.lessons.map((lesson: CourseLesson, index: number) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setSelectedQuiz(null);
                      setSelectedFlashcardSet(null);
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Modern gradient badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">
                          {String(index + 1).padStart(2, '0')}
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    No lesson selected
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Select a lesson to start studying
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedLesson.title}
                    </h2>
                    {selectedLesson.file && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedLesson.file.originalName}
                      </p>
                    )}
                  </div>
                  <div className="border-b dark:border-gray-700">
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
                              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-medium'
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No lessons available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
