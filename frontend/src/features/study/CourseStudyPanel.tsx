import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  FileText,
  BookOpen,
  HelpCircle,
  Layers,
  Loader2,
  AlertCircle,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import FileSelectionPane from './FileSelectionPane';
import PaginatedReader from './PaginatedReader';
import StudyFlashcards from './StudyFlashcards';
import StudyQuiz from './StudyQuiz';

type StudyTab = 'summary' | 'notes' | 'quiz' | 'flashcards';

interface CourseFile {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  isAICompatible: boolean;
}

interface StudyStatusResponse {
  canStudy: boolean;
  reason: string;
  isOwner: boolean;
  role: string;
  totalFiles: number;
  aiCompatibleFiles: number;
  files: CourseFile[];
}

interface CourseStudyPanelProps {
  courseId: string;
  courseTitle: string;
  onClose?: () => void;
}

const TABS: { id: StudyTab; label: string; icon: typeof FileText; color: string }[] = [
  { id: 'summary', label: 'Summary', icon: FileText, color: 'text-blue-500' },
  { id: 'notes', label: 'Notes', icon: BookOpen, color: 'text-green-500' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-purple-500' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, color: 'text-orange-500' },
];

export default function CourseStudyPanel({
  courseId,
  courseTitle,
  onClose,
}: CourseStudyPanelProps) {
  const [activeTab, setActiveTab] = useState<StudyTab>('summary');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch study access status
  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery<StudyStatusResponse>({
    queryKey: ['study-status', courseId],
    queryFn: async () => {
      const response = await api.get(`/ai/study/status/${courseId}`);
      return response.data;
    },
  });

  // Auto-select all AI-compatible files on load
  useEffect(() => {
    if (statusData?.files) {
      const aiFiles = statusData.files.filter((f) => f.isAICompatible);
      if (aiFiles.length > 0 && selectedFileIds.size === 0) {
        setSelectedFileIds(new Set(aiFiles.map((f) => f.id)));
      }
    }
  }, [statusData?.files]);

  // Generate study content mutation
  const generateMutation = useMutation({
    mutationFn: async ({ type, refresh = false }: { type: StudyTab; refresh?: boolean }) => {
      const response = await api.post(`/ai/study${refresh ? '?refresh=true' : ''}`, {
        courseId,
        fileIds: Array.from(selectedFileIds),
        type,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['study-content', courseId, Array.from(selectedFileIds).sort().join(','), activeTab],
        data
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate study content');
    },
  });

  // Query for cached content
  const fileIdsKey = useMemo(() => Array.from(selectedFileIds).sort().join(','), [selectedFileIds]);

  const {
    data: studyContent,
    isLoading: contentLoading,
    refetch,
  } = useQuery({
    queryKey: ['study-content', courseId, fileIdsKey, activeTab],
    queryFn: async () => {
      const response = await api.post('/ai/study', {
        courseId,
        fileIds: Array.from(selectedFileIds),
        type: activeTab,
      });
      return response.data;
    },
    enabled: selectedFileIds.size > 0 && statusData?.canStudy === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRegenerate = () => {
    generateMutation.mutate({ type: activeTab, refresh: true });
  };

  const handleTabChange = (tab: StudyTab) => {
    setActiveTab(tab);
  };

  const isGenerating = generateMutation.isPending || contentLoading;

  // Loading state
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Error or no access
  if (statusError || !statusData?.canStudy) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Study Access Restricted
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          {statusData?.reason || 'You do not have access to study this course.'}
        </p>
      </div>
    );
  }

  // No AI-compatible files
  if (statusData.aiCompatibleFiles === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Compatible Files
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          This course doesn't have any files that support AI study features. Upload PDFs, Word
          documents, or text files to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl">
      {/* Header - Aurora Gradient */}
      <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-aurora relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 blur-xl" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">AI Study Mode</h2>
            <p className="text-sm text-white/90 font-medium">{courseTitle}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2.5 text-white/90 hover:text-white hover:bg-white/20 rounded-xl transition-all relative z-10 backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: File Selection */}
        <div className="w-72 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-800/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Select Files to Study
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <FileSelectionPane
              files={statusData.files}
              selectedFileIds={selectedFileIds}
              onSelectionChange={setSelectedFileIds}
              isLoading={isGenerating}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Right: Study Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
          {/* Tabs - Modern design with smooth animations */}
          <LayoutGroup>
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 relative">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    disabled={selectedFileIds.size === 0}
                    whileHover={selectedFileIds.size > 0 ? { y: -1 } : {}}
                    whileTap={selectedFileIds.size > 0 ? { scale: 0.98 } : {}}
                    className={`relative flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      isActive
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <tab.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-purple-500' : 'text-slate-400'}`} />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900/50">
            <AnimatePresence mode="wait">
              {selectedFileIds.size === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center h-full p-8 text-center"
                >
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 rounded-2xl mb-4">
                    <Sparkles className="h-12 w-12 text-purple-400 dark:text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Select Files to Study
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-sm">
                    Choose one or more files from the left panel to generate AI-powered study
                    materials.
                  </p>
                </motion.div>
              ) : isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center h-full p-8"
                >
                  <div className="mb-6">
                    <Loader2 className="h-12 w-12 text-purple-600 [animation:spin_.65s_linear_infinite] transform-gpu will-change-transform" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Generating {activeTab}...</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    This may take a moment for large files
                  </p>
                </motion.div>
              ) : studyContent?.result ? (
                <motion.div
                  key={activeTab + '-content'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  {activeTab === 'summary' && studyContent.result.pages && (
                    <PaginatedReader
                      type="summary"
                      pages={studyContent.result.pages}
                      onRegenerate={handleRegenerate}
                      isRegenerating={generateMutation.isPending}
                    />
                  )}
                  {activeTab === 'notes' && studyContent.result.pages && (
                    <PaginatedReader
                      type="notes"
                      pages={studyContent.result.pages}
                      onRegenerate={handleRegenerate}
                      isRegenerating={generateMutation.isPending}
                    />
                  )}
                  {activeTab === 'quiz' && studyContent.result.questions && (
                    <StudyQuiz
                      data={studyContent.result}
                      onRegenerate={handleRegenerate}
                      isRegenerating={generateMutation.isPending}
                    />
                  )}
                  {activeTab === 'flashcards' && studyContent.result.cards && (
                    <StudyFlashcards
                      data={studyContent.result}
                      onRegenerate={handleRegenerate}
                      isRegenerating={generateMutation.isPending}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center h-full p-8 text-center"
                >
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                    <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    No Content Yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm">
                    Click the button below to generate study materials.
                  </p>
                  <motion.button
                    onClick={() => refetch()}
                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-gradient-aurora text-white font-semibold rounded-2xl shadow-lg hover:shadow-glow-purple transition-all"
                  >
                    Generate {activeTab}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
