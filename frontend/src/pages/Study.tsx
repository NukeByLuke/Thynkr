/**
 * Study Page - Fluid Workspace
 * Modern, abstract design with floating shapes and split-action cards.
 * Layout: Abstract Header → Action Grid → Recent Files → Full Study Interface
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { UploadCloud, FolderOpen, FileText, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SummaryView from '@/features/study/SummaryView';
import NotesView from '@/features/study/NotesView';
import FlashcardViewer from '@/features/study/FlashcardViewer';
import QuizPlayer from '@/features/study/QuizPlayer';
import { useStudySession } from '@/hooks/useStudySession';
import { FileTypeBadge } from '@/lib/fileTypeUtils';
import UploadModal from '@/components/UploadModal';
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

export default function Study() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fileId } = useParams<{ fileId: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { setHideSidebar, setCustomHeaderContent } = useLayout();

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

  // Get 3 most recent files for "Jump Back In"
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

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
    } else if (!fileId && selectedFile) {
      // No fileId in URL but file is selected, clear selection
      setSelectedFile(null);
    }
  }, [fileId, files, selectedFile?.id, setSelectedFile, navigate]);

  // Clear layout state when navigating away from /study
  useEffect(() => {
    if (!location.pathname.startsWith('/study')) {
      setHideSidebar(false);
      setCustomHeaderContent(null);
      setSelectedFile(null);
    }
  }, [location.pathname, setHideSidebar, setCustomHeaderContent, setSelectedFile]);

  // Manage sidebar and header content based on selected file
  useEffect(() => {
    // Only set custom header if we're actually on the study page
    if (!location.pathname.startsWith('/study')) {
      return;
    }

    if (selectedFile) {
      // Hide sidebar and show custom header with tabs
      setHideSidebar(true);
      setCustomHeaderContent(
        <>
          {/* Back Button + File Info */}
          <button
            onClick={() => navigate('/study')}
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
    } else {
      // Show sidebar and clear custom header
      setHideSidebar(false);
      setCustomHeaderContent(null);
    }

    // Cleanup on unmount
    return () => {
      setHideSidebar(false);
      setCustomHeaderContent(null);
    };
  }, [selectedFile, activeTab, location.pathname, setHideSidebar, setCustomHeaderContent, setActiveTab, setSelectedFlashcardSet]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post('/study/upload', formData);
      return response.data;
    },
    onSuccess: async (data) => {
      setUploadError(null);
      // Refetch immediately to show new files
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      await queryClient.refetchQueries({ queryKey: ['study-files'] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Auto-navigate to the first uploaded file
      if (data.files && data.files.length > 0) {
        navigate(`/study/${data.files[0].id}`);
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
    setShowUploadModal(true);
  };

  const handleUploadFiles = (files: FileList) => {
    uploadMutation.mutate(files);
    setShowUploadModal(false);
  };

  const handleUploadYouTube = async (url: string) => {
    setShowUploadModal(false);
    try {
      await api.post('/study/upload-youtube', { url });
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      toast.success('YouTube video added successfully');
    } catch (error) {
      toast.error('Failed to add YouTube video');
    }
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
        // Always show QuizPlayer directly - no lists, no saving
        return (
          <div>
            <QuizPlayer
              quizId={selectedQuiz?.id || "temp-quiz"}
              title={selectedFile.originalName}
              questions={selectedQuiz?.questions || []} // Use generated quiz questions
              fileId={selectedFile.id}
              onGenerateQuiz={(difficulty: string, numQuestions: number) => {
                // Convert difficulty to uppercase for backend API
                generateQuizMutation.mutate({ 
                  fileId: selectedFile.id, 
                  difficulty: difficulty.toUpperCase(), 
                  numQuestions 
                });
              }}
              isGenerating={generateQuizMutation.isPending}
              onSubmit={async (answers, timeSpentSeconds) => {
                // Submit to backend if we have a real quiz ID
                if (selectedQuiz?.id) {
                  try {
                    const response = await api.post(`/study/quizzes/${selectedQuiz.id}/submit`, {
                      answers,
                      timeSpentSeconds,
                    });
                    
                    // Show achievement notifications if any were unlocked
                    if (response.data.achievements && response.data.achievements.length > 0) {
                      response.data.achievements.forEach((ach: any) => {
                        toast.success(
                          `🎉 Achievement Unlocked: ${ach.achievementName} (${ach.newTier})! +${ach.xpAwarded} XP`,
                          { duration: 5000 }
                        );
                      });
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
                  // Fallback: Calculate score locally if no quiz ID (shouldn't happen normally)
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

  // Show full study interface if a file is selected
  if (selectedFile) {
    // Determine which generation modal to show
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
        {/* Generation Modal */}
        <GenerationModal 
          isOpen={activeGenerationType !== null} 
          type={activeGenerationType || 'summary'} 
        />

        {/* Main Content Area - Full Height */}
        <div className="h-full overflow-y-auto">
          {renderTabContent()}
        </div>
      </>
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
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 h-44">
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
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Study Center
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Resume where you left off or start something new
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Upload Error Display */}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
            </div>
          )}

          {/* Action Cards - Minimal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {/* Card 1: Browse Library */}
            <button
              onClick={() => navigate('/files')}
              className="group card-hover p-5 text-left transition-[border-color,transform] duration-200 active:scale-95 hover:border-slate-400 dark:hover:border-white/30"
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
              className="group card-hover p-5 text-left transition-[border-color,transform] duration-200 active:scale-95 hover:border-slate-400 dark:hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Upload files or add YouTube videos
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors flex-shrink-0" />
              </div>
            </button>
          </div>

          {/* Recent Files Section */}
          {recentFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-heading flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Jump Back In
                </h2>
              </div>
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <motion.button
                    key={file.id}
                    onClick={() => navigate(`/study/${file.id}`)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-4 p-4 card-hover transition-[border-color,transform] duration-200 group hover:border-indigo-500/50"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-heading group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {file.originalName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <FileTypeBadge mimeType={file.fileType} />
                        <span className="text-sm text-muted">
                          {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                        </span>
                      </div>
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

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadFiles={handleUploadFiles}
        onUploadYouTube={handleUploadYouTube}
        isUploading={uploadMutation.isPending}
      />
    </div>
  );
}
