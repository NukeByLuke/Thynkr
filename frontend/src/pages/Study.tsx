/**
 * Study Page - Fluid Workspace
 * Modern, abstract design with floating shapes and split-action cards.
 * Layout: Abstract Header → Action Grid → Recent Files → Full Study Interface
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { UploadCloud, FolderOpen, FileText, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SummaryView from '@/features/study/SummaryView';
import NotesView from '@/features/study/NotesView';
import FlashcardViewer from '@/features/study/FlashcardViewer';
import QuizPlayer from '@/features/study/QuizPlayer';
import { useStudySession } from '@/hooks/useStudySession';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

export default function Study() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('accessToken');

  // Use the unified study session hook
  const {
    selectedFile,
    activeTab,
    selectedQuiz,
    selectedFlashcardSet,
    numQuestions,
    quizDifficulty,
    numCards,
    setSelectedFile,
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
  } = useStudySession({ queryKey: ['study-files'] });

  // Fetch uploaded files
  const { data: filesData, isLoading } = useQuery({
    queryKey: ['study-files'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/files`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
    enabled: !!getToken(),
  });

  const files: UploadedFile[] = filesData?.files || [];

  // Get 3 most recent files for "Jump Back In"
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Auto-select file from query param
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fileId = searchParams.get('file');

    if (fileId && files.length > 0) {
      const file = files.find((f) => f.id === fileId);
      if (file) {
        setSelectedFile(file);
        // Clear the query param from URL
        navigate('/study', { replace: true });
      }
    }
  }, [location.search, files, navigate]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_URL}/study/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      setUploadError(null);
      // Refetch immediately to show new files
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      await queryClient.refetchQueries({ queryKey: ['study-files'] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Auto-select the first uploaded file
      if (data.files && data.files.length > 0) {
        setSelectedFile(data.files[0]);
      }
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      console.error('Upload error:', error);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files);
    }
  };

  const handleQuickUpload = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={generateFlashcardsMutation.isPending}
                >
                  {generateFlashcardsMutation.isPending ? 'Generating...' : 'Generate Flashcards'}
                </button>
              </>
            )}
          </div>
        );

      case 'quizzes':
        if (selectedQuiz) {
          return (
            <div>
              <button onClick={() => setSelectedQuiz(null)} className="mb-4 text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
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

        if (selectedFile.quizzes && selectedFile.quizzes.length > 0) {
          return (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Your Quizzes</h3>
              {selectedFile.quizzes.map((quiz: { id: string; title: string; questions: any[] }) => (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedQuiz(quiz)}
                  className="w-full text-left p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                >
                  <span className="text-slate-900 dark:text-white">{quiz.title}</span>
                  <span className="text-slate-500 dark:text-slate-400"> • {quiz.questions.length} questions</span>
                </button>
              ))}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-center space-y-6">
                {!generateQuizMutation.isPending && (
                  <>
                    <p className="mb-4 text-slate-600 dark:text-slate-400">Generate new quiz</p>
                    <div className="max-w-xs mx-auto space-y-4 mb-4">
                      <div>
                        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">
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
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={generateQuizMutation.isPending}
                    >
                      {generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="text-center py-12 space-y-6">
            {!generateQuizMutation.isPending && (
              <>
                <p className="text-slate-600 dark:text-slate-400 mb-4">No quizzes yet</p>
                <div className="max-w-xs mx-auto space-y-4 mb-4">
                  <div>
                    <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={generateQuizMutation.isPending}
                >
                  {generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
                </button>
              </>
            )}
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

  // Show full study interface if a file is selected
  if (selectedFile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Back Button */}
        <div className="glass-panel-strong border-b border-slate-200/50 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <button
              onClick={() => setSelectedFile(null)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2"
            >
              ← Back to Study Center
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="glass-panel-strong rounded-3xl shadow-xl">
              
              {/* File Header */}
              <div className="p-8 border-b border-slate-200/50 dark:border-white/10">
                <h2 className="text-2xl font-bold text-heading">
                  {selectedFile.originalName}
                </h2>
                <p className="text-sm text-muted mt-1">
                  {selectedFile.fileType.toUpperCase()} • {formatFileSize(selectedFile.fileSize)}
                </p>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-slate-200/50 dark:border-white/10">
                <div className="flex space-x-6 sm:space-x-10 px-6 sm:px-8 overflow-x-auto scrollbar-hide">
                  {(['summary', 'notes', 'flashcards', 'quizzes'] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedQuiz(null);
                        setSelectedFlashcardSet(null);
                      }}
                      className={`py-4 sm:py-5 border-b-2 capitalize transition-all duration-300 whitespace-nowrap text-base sm:text-lg ${
                        activeTab === tab
                          ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300/50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Study Center View (No file selected)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.pps,.ppsx"
        multiple
        onChange={handleFileSelect}
      />

      {/* Abstract Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 h-56">
        {/* Floating Abstract Shapes */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-32 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-56 h-56 bg-cyan-500 rounded-full blur-3xl opacity-20"
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Study Center
          </h1>
          <p className="text-lg text-slate-200 dark:text-slate-300 max-w-2xl">
            Resume where you left off or start something new
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-12">
          
          {/* Upload Error Display */}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
            </div>
          )}

          {/* Action Cards - Minimal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {/* Card 1: Browse Library */}
            <button
              onClick={() => navigate('/files')}
              className="group card-hover p-6 text-left transition-all hover:border-slate-400 dark:hover:border-white/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-heading mb-1">
                    Browse Files
                  </h3>
                  <p className="text-sm text-body">
                    View and manage your entire library
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors flex-shrink-0" />
              </div>
            </button>

            {/* Card 2: Quick Upload */}
            <button
              onClick={handleQuickUpload}
              disabled={uploadMutation.isPending}
              className="group card-hover p-6 text-left transition-all hover:border-slate-400 dark:hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UploadCloud className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-heading mb-1">
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Material'}
                  </h3>
                  <p className="text-sm text-body">
                    Add new documents, PDFs, or files
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors flex-shrink-0" />
              </div>
            </button>
          </div>

          {/* Recent Files Section */}
          {recentFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-heading flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Jump Back In
                </h2>
              </div>
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <motion.button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center gap-4 p-4 card-hover transition-all duration-300 group hover:border-indigo-500/50"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-heading group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {file.originalName}
                      </h3>
                      <p className="text-sm text-muted">
                        {file.fileType.toUpperCase()} • {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-heading mb-2">
                No files yet
              </h3>
              <p className="text-body mb-6">
                Upload your first file to get started with AI-powered study tools
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
