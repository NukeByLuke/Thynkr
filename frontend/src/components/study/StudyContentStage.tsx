import React from 'react';
import SummaryView from '../../features/study/SummaryView';
import NotesView from '../../features/study/NotesView';
import FlashcardViewer from '../../features/study/FlashcardViewer';
import QuizPlayer from '../../features/study/QuizPlayer';
import GenerationLoader from '../ui/GenerationLoader';
import { GraduationCap } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import type { UseMutationResult } from '@tanstack/react-query';

interface StudyFile {
  id: string;
  originalName: string;
  fileSize: number;
  status: string;
  summary?: {
    content: string;
  };
  notes?: {
    keyPoints: string[];
    detailed: string;
  };
  quizzes?: Array<{
    id: string;
    title: string;
    questions: any[];
  }>;
  flashcardSets?: Array<{
    id: string;
    title: string;
    cards: any[];
  }>;
}

interface StudyContentStageProps {
  selectedFile: StudyFile | null;
  activeTab: string;
  selectedQuiz: any | null;
  selectedFlashcardSet: any | null;
  numCards: number;
  numQuestions: number;
  quizDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  onSetNumCards: (n: number) => void;
  onSetNumQuestions: (n: number) => void;
  onSetQuizDifficulty: (d: 'EASY' | 'MEDIUM' | 'HARD') => void;
  onSetSelectedQuiz: (quiz: any | null) => void;
  generateSummaryMutation: UseMutationResult<any, Error, any, unknown>;
  generateNotesMutation: UseMutationResult<any, Error, any, unknown>;
  generateFlashcardsMutation: UseMutationResult<any, Error, any, unknown>;
  generateQuizMutation: UseMutationResult<any, Error, any, unknown>;
  submitQuizMutation: UseMutationResult<any, Error, any, unknown>;
}

export const StudyContentStage: React.FC<StudyContentStageProps> = ({
  selectedFile,
  activeTab,
  selectedQuiz,
  selectedFlashcardSet,
  numCards,
  numQuestions,
  quizDifficulty,
  onSetNumCards,
  onSetNumQuestions,
  onSetQuizDifficulty,
  onSetSelectedQuiz,
  generateSummaryMutation,
  generateNotesMutation,
  generateFlashcardsMutation,
  generateQuizMutation,
  submitQuizMutation,
}) => {
  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="No file selected"
          description="Choose a file from the sidebar to begin studying"
        />
      </div>
    );
  }

  if (selectedFile.status !== 'COMPLETED') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-12 text-slate-600 dark:text-slate-300">
          <p>File processing {selectedFile.status === 'PROCESSING' ? 'in progress...' : 'failed'}</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
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
            <GenerationLoader isVisible={generateSummaryMutation.isPending} />
            {!generateSummaryMutation.isPending && (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">No summary generated yet</p>
                <button
                  onClick={() => generateSummaryMutation.mutate({ fileId: selectedFile.id })}
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-colors shadow-soft-lg hover:shadow-glow-brand"
                >
                  Generate Summary
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
            <GenerationLoader isVisible={generateNotesMutation.isPending} />
            {!generateNotesMutation.isPending && (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">No notes generated yet</p>
                <button
                  onClick={() => generateNotesMutation.mutate({ fileId: selectedFile.id })}
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-colors shadow-soft-lg hover:shadow-glow-brand"
                >
                  Generate Notes
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
            <GenerationLoader isVisible={generateFlashcardsMutation.isPending} />
            {!generateFlashcardsMutation.isPending && (
              <>
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
                    onChange={(e) => onSetNumCards(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={() =>
                    generateFlashcardsMutation.mutate({ fileId: selectedFile.id, numCards })
                  }
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-colors shadow-soft-lg hover:shadow-glow-brand"
                >
                  Generate Flashcards
                </button>
              </>
            )}
          </div>
        );

      case 'quizzes':
        if (selectedQuiz) {
          return (
            <div>
              <button
                onClick={() => onSetSelectedQuiz(null)}
                className="mb-4 text-brand-600 dark:text-brand-400 text-sm hover:underline"
              >
                ← Back to quizzes
              </button>
              <QuizPlayer
                quizId={selectedQuiz.id}
                title={selectedQuiz.title}
                questions={selectedQuiz.questions}
                onSubmit={(answers: Record<string, string>) =>
                  submitQuizMutation.mutateAsync({ quizId: selectedQuiz.id, answers })
                }
              />
            </div>
          );
        }

        if (selectedFile.quizzes && selectedFile.quizzes.length > 0) {
          return (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Your Quizzes</h3>
              <div className="space-y-3">
                {selectedFile.quizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => onSetSelectedQuiz(quiz)}
                    className="w-full text-left p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-500 dark:hover:border-brand-500 transition-colors bg-white dark:bg-slate-800"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{quiz.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {quiz.questions.length} questions
                    </p>
                  </button>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 text-center space-y-6">
                <GenerationLoader isVisible={generateQuizMutation.isPending} />
                {!generateQuizMutation.isPending && (
                  <>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Generate a new quiz</p>
                    <div className="max-w-xs mx-auto space-y-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Questions: {numQuestions}
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="20"
                          value={numQuestions}
                          onChange={(e) => onSetNumQuestions(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <select
                        value={quizDifficulty}
                        onChange={(e) => onSetQuizDifficulty(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                    <button
                      onClick={() =>
                        generateQuizMutation.mutate({
                          fileId: selectedFile.id,
                          numQuestions,
                          difficulty: quizDifficulty,
                        })
                      }
                      className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-colors shadow-soft-lg hover:shadow-glow-brand"
                    >
                      Generate Quiz
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="text-center py-12 space-y-6">
            <GenerationLoader isVisible={generateQuizMutation.isPending} />
            {!generateQuizMutation.isPending && (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">No quizzes yet</p>
                <div className="max-w-xs mx-auto space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Questions: {numQuestions}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={numQuestions}
                      onChange={(e) => onSetNumQuestions(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => onSetQuizDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    generateQuizMutation.mutate({
                      fileId: selectedFile.id,
                      numQuestions,
                      difficulty: quizDifficulty,
                    })
                  }
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-colors shadow-soft-lg hover:shadow-glow-brand"
                >
                  Generate Quiz
                </button>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {selectedFile.originalName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Study mode • {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          {renderTabContent()}
        </div>
      </div>
    </main>
  );
};
