import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-white" />
          <div>
            <h2 className="font-semibold text-white">AI Study Mode</h2>
            <p className="text-sm text-white/80">{courseTitle}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: File Selection */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                disabled={selectedFileIds.size === 0}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? tab.color : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {selectedFileIds.size === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Sparkles className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select Files to Study
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  Choose one or more files from the left panel to generate AI-powered study
                  materials.
                </p>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Generating {activeTab}...</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  This may take a moment for large files
                </p>
              </div>
            ) : studyContent?.result ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
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
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Content Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Click the button below to generate study materials.
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  Generate {activeTab}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
