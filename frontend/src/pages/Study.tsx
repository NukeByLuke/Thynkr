/**
 * Study Page
 * Main study hub for file uploads and AI-generated study materials (summaries, notes, flashcards, quizzes).
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import SummaryView from '@/features/study/SummaryView';
import NotesView from '@/features/study/NotesView';
import FlashcardViewer from '@/features/study/FlashcardViewer';
import QuizPlayer from '@/features/study/QuizPlayer';
import EmptyState from '@/components/ui/EmptyState';
import GenerationLoader from '@/components/ui/GenerationLoader';
import LibraryHeader from '@/components/study/LibraryHeader';
import FileCard from '@/components/study/FileCard';
import FilterBar, { FileFilter, SortOrder } from '@/components/study/FilterBar';
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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

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

  // Filter files based on search query and file type
  const filteredFiles = files
    .filter((file) => {
      // Search filter
      const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      let matchesType = true;
      if (activeFilter !== 'all') {
        const fileExt = file.fileType.toLowerCase();
        switch (activeFilter) {
          case 'pdf':
            matchesType = fileExt === 'pdf';
            break;
          case 'document':
            matchesType = ['doc', 'docx', 'txt'].includes(fileExt);
            break;
          case 'audio':
            matchesType = ['mp3', 'wav', 'm4a', 'ogg'].includes(fileExt);
            break;
        }
      }
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

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
            <GenerationLoader isVisible={generateSummaryMutation.isPending} />
            {!generateSummaryMutation.isPending && (
              <>
                <p className="text-gray-600 mb-4">No summary generated yet</p>
                <button
                  onClick={() => generateSummaryMutation.mutate({ fileId: selectedFile.id })}
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all duration-300 ease-out shadow-soft-lg hover:shadow-glow-brand"
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
                <p className="text-gray-600 mb-4">No notes generated yet</p>
                <button
                  onClick={() => generateNotesMutation.mutate({ fileId: selectedFile.id })}
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all duration-300 ease-out shadow-soft-lg hover:shadow-glow-brand"
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
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all duration-300 ease-out shadow-soft-lg hover:shadow-glow-brand"
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
              {selectedFile.quizzes.map((quiz: { id: string; title: string; questions: any[] }) => (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedQuiz(quiz)}
                  className="w-full text-left p-4 border rounded-lg hover:border-brand-600"
                >
                  {quiz.title} • {quiz.questions.length} questions
                </button>
              ))}
              <div className="pt-4 border-t text-center space-y-6">
                <GenerationLoader isVisible={generateQuizMutation.isPending} />
                {!generateQuizMutation.isPending && (
                  <>
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
                      className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all duration-300 ease-out shadow-soft-lg hover:shadow-glow-brand"
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
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all duration-300 ease-out shadow-soft-lg hover:shadow-glow-brand"
                >
                  Generate Quiz
                </button>
              </>
            )}
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
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Premium Library Header */}
      <LibraryHeader
        onUploadClick={() => fileInputRef.current?.click()}
        onSearch={setSearchQuery}
        fileCount={files.length}
        isUploading={uploadMutation.isPending}
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id="file-upload"
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.pps,.ppsx"
        multiple
        onChange={handleFileSelect}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-8">
          {/* Upload Error Display */}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm animate-fade-in">
              <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
            </div>
          )}

          {/* Drag & Drop Overlay */}
          {isDragging && (
            <div
              className="fixed inset-0 z-50 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 shadow-2xl border-4 border-dashed border-blue-500">
                <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  Drop files here to upload
                </p>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          {files.length > 0 && (
            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          )}

          {/* Files Grid Section */}
          {filteredFiles.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-soft-xl border border-white/20 dark:border-slate-700/30 p-12">
              <EmptyState
                icon={<Upload className="h-8 w-8" />}
                title={searchQuery ? 'No files found' : 'No files yet'}
                description={
                  searchQuery
                    ? 'Try adjusting your search query'
                    : 'Click "Upload New File" to start learning smarter with AI'
                }
                illustration="study"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  id={file.id}
                  originalName={file.originalName}
                  fileType={file.fileType}
                  fileSize={file.fileSize}
                  status={file.status}
                  createdAt={file.createdAt}
                  isSelected={selectedFile?.id === file.id}
                  onClick={() => {
                    setSelectedFile(file);
                    setSelectedQuiz(null);
                    setSelectedFlashcardSet(null);
                  }}
                  onRename={() => {
                    // TODO: Implement rename functionality
                    console.log('Rename file:', file.id);
                  }}
                  onDelete={() => {
                    // TODO: Implement delete functionality
                    console.log('Delete file:', file.id);
                  }}
                />
              ))}
            </div>
          )}

          {/* Selected File Content */}
          {selectedFile && (
            <div className="mt-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-soft-xl border border-white/20 dark:border-slate-700/30 transition-all duration-300 ease-out hover:shadow-soft-2xl">
              <div className="p-8 border-b border-white/20 dark:border-slate-700/30">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedFile.originalName}
                </h2>
              </div>
              <div className="border-b border-white/20 dark:border-slate-700/30">
                <div className="flex space-x-6 sm:space-x-10 px-6 sm:px-8 overflow-x-auto scrollbar-hide">
                  {(['summary', 'notes', 'flashcards', 'quizzes'] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedQuiz(null);
                        setSelectedFlashcardSet(null);
                      }}
                      className={`py-4 sm:py-5 border-b-2 capitalize transition-all duration-300 ease-out whitespace-nowrap text-base sm:text-lg ${
                        activeTab === tab
                          ? 'border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400 font-semibold'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300/50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-8">{renderTabContent()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
