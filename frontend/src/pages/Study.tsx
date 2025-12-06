/**
 * Study Page
 * Main study hub for file uploads and AI-generated study materials (summaries, notes, flashcards, quizzes).
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import SummaryView from '../components/study/SummaryView';
import NotesView from '../components/study/NotesView';
import FlashcardViewer from '../components/study/FlashcardViewer';
import QuizPlayer from '../components/study/QuizPlayer';
import EmptyState from '../components/EmptyState';

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
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState<any | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [numCards, setNumCards] = useState(20);

  const getToken = () => localStorage.getItem('accessToken');

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

  // Generate summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async ({
      fileId,
      regenerate = false,
    }: {
      fileId: string;
      regenerate?: boolean;
    }) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ regenerate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate summary');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Update the cache immediately with optimistic data
      queryClient.setQueryData(['study-files'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.map((f: any) =>
            f.id === selectedFile?.id ? { ...f, summary: data.summary } : f
          ),
        };
      });
      // Refetch to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      // Update selected file immediately
      if (selectedFile) {
        setSelectedFile({ ...selectedFile, summary: data.summary });
      }
      toast.success('Summary generated successfully!');
    },
    onError: (error: Error) => {
      console.error('Summary generation error:', error);
      toast.error(`Failed to generate summary: ${error.message}`);
    },
  });

  // Generate notes mutation
  const generateNotesMutation = useMutation({
    mutationFn: async ({
      fileId,
      regenerate = false,
    }: {
      fileId: string;
      regenerate?: boolean;
    }) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ regenerate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate notes');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Update the cache immediately
      queryClient.setQueryData(['study-files'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.map((f: any) =>
            f.id === selectedFile?.id ? { ...f, notes: data.notes } : f
          ),
        };
      });
      // Refetch to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      // Update selected file immediately
      if (selectedFile) {
        setSelectedFile({ ...selectedFile, notes: data.notes });
      }
      toast.success('Notes generated successfully!');
    },
    onError: (error: Error) => {
      console.error('Notes generation error:', error);
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
      // Update the cache immediately
      queryClient.setQueryData(['study-files'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.map((f: any) =>
            f.id === selectedFile?.id ? { ...f, quizzes: [...(f.quizzes || []), data.quiz] } : f
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      setSelectedQuiz(data.quiz);
      // Update selected file
      if (selectedFile) {
        setSelectedFile({
          ...selectedFile,
          quizzes: [...(selectedFile.quizzes || []), data.quiz],
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
      // Update the cache immediately
      queryClient.setQueryData(['study-files'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.map((f: any) =>
            f.id === selectedFile?.id
              ? { ...f, flashcardSets: [...(f.flashcardSets || []), data.flashcardSet] }
              : f
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      setSelectedFlashcardSet(data.flashcardSet);
      // Update selected file
      if (selectedFile) {
        setSelectedFile({
          ...selectedFile,
          flashcardSets: [...(selectedFile.flashcardSets || []), data.flashcardSet],
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadMutation.mutate(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'PROCESSING':
        return 'text-yellow-600 bg-yellow-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderTabContent = () => {
    if (!selectedFile || selectedFile.status !== 'COMPLETED') {
      return (
        <div className="text-center py-12 text-gray-500">
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
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No summary generated yet</p>
            <button
              onClick={() => generateSummaryMutation.mutate({ fileId: selectedFile.id })}
              disabled={generateSummaryMutation.isPending}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {generateSummaryMutation.isPending ? 'Generating...' : 'Generate Summary'}
            </button>
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
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No notes generated yet</p>
            <button
              onClick={() => generateNotesMutation.mutate({ fileId: selectedFile.id })}
              disabled={generateNotesMutation.isPending}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {generateNotesMutation.isPending ? 'Generating...' : 'Generate Notes'}
            </button>
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
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No flashcards yet</p>
            <div className="max-w-xs mx-auto mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              disabled={generateFlashcardsMutation.isPending}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {generateFlashcardsMutation.isPending ? 'Generating...' : 'Generate Flashcards'}
            </button>
          </div>
        );

      case 'quizzes':
        if (selectedQuiz) {
          return (
            <div>
              <button onClick={() => setSelectedQuiz(null)} className="mb-4 text-brand-600 text-sm">
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
              <h3 className="font-semibold">Your Quizzes</h3>
              {selectedFile.quizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedQuiz(quiz)}
                  className="w-full text-left p-4 border rounded-lg hover:border-brand-600"
                >
                  {quiz.title} • {quiz.questions.length} questions
                </button>
              ))}
              <div className="pt-4 border-t text-center">
                <p className="mb-4">Generate new quiz</p>
                <div className="max-w-xs mx-auto space-y-4 mb-4">
                  <div>
                    <label className="block text-sm mb-2">Questions: {numQuestions}</label>
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
                    className="w-full px-3 py-2 border rounded-lg"
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
                  disabled={generateQuizMutation.isPending}
                  className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  {generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No quizzes yet</p>
            <div className="max-w-xs mx-auto space-y-4 mb-4">
              <div>
                <label className="block text-sm mb-2">Questions: {numQuestions}</label>
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
                className="w-full px-3 py-2 border rounded-lg"
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
              disabled={generateQuizMutation.isPending}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 dark:border-brand-400"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Study Header with Emerald-Blue Gradient */}
      <div className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Study</h1>
          </div>
          <p className="text-white/90 text-sm ml-14">Upload materials and let AI help you learn</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-8 cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-400'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <svg
              className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PDF, DOC/DOCX, TXT, or PowerPoint files
            </p>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.pps,.ppsx"
              multiple
              onChange={handleFileSelect}
            />
            {uploadMutation.isPending && (
              <div className="mt-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 dark:border-brand-400"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Uploading and processing...
                </p>
              </div>
            )}
            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
              </div>
            )}
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Your Files</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{files.length} files</p>
              </div>
              <div className="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {files.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={<Upload className="h-6 w-6" />}
                      title="No files yet"
                      description="Upload a file above to start learning smarter with AI"
                      illustration="study"
                    />
                  </div>
                ) : (
                  files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedFile(file);
                        setSelectedQuiz(null);
                        setSelectedFlashcardSet(null);
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedFile?.id === file.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                      }`}
                    >
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.fileSize)}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(file.status)}`}
                      >
                        {file.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {!selectedFile ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <EmptyState
                    icon={<GraduationCap className="h-8 w-8" />}
                    title="Select a file to start"
                    description="Choose a file from the sidebar to generate summaries, notes, flashcards, and quizzes"
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedFile.originalName}
                    </h2>
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
        </div>
      </div>
    </div>
  );
}
