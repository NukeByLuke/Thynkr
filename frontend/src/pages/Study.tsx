/**
 * Study Page - Study Center Dashboard
 * Modern, abstract design with floating shapes and split-action cards.
 * Layout: Abstract Header → Action Grid → Recent Files
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '@/contexts/LayoutContext';
import { UploadCloud, FolderOpen, FileText, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FileTypeBadge } from '@/lib/fileTypeUtils';
import UploadModal from '@/components/UploadModal';
import YouTubeProcessingOverlay from '@/components/YouTubeProcessingOverlay';
import api from '@/lib/api';

interface UploadedFile {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export default function Study() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setHideSidebar, setCustomHeaderContent } = useLayout();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessingYouTube, setIsProcessingYouTube] = useState(false);
  const [processingVideoTitle, setProcessingVideoTitle] = useState<string | undefined>();

  // CRITICAL: Reset layout on mount
  useEffect(() => {
    setHideSidebar(false);
    setCustomHeaderContent(null);
  }, [setHideSidebar, setCustomHeaderContent]);

  const getToken = () => localStorage.getItem('accessToken');

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

  const handleQuickUpload = () => {
    setShowUploadModal(true);
  };

  const handleUploadFiles = (files: FileList) => {
    uploadMutation.mutate(files);
    setShowUploadModal(false);
  };

  const handleUploadYouTube = async (url: string) => {
    setShowUploadModal(false);
    setIsProcessingYouTube(true);
    setProcessingVideoTitle(undefined);
    
    try {
      const response = await api.post('/study/upload-youtube', { url });
      setIsProcessingYouTube(false);
      toast.success('YouTube video ready!');
      // Invalidate queries and navigate using React Router
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      if (response.data?.file?.id) {
        navigate(`/study/${response.data.file.id}`);
      }
    } catch (error: any) {
      setIsProcessingYouTube(false);
      const message = error?.response?.data?.error || 'Failed to add YouTube video';
      toast.error(message);
    }
  };

  const handleCancelYouTubeProcessing = () => {
    // Note: We can't actually cancel the API call, but we can hide the overlay
    // The request will complete in the background
    setIsProcessingYouTube(false);
    toast('Processing cancelled - the video may still be added', { icon: '⚠️' });
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Abstract Header - Elegant Aurora Theme */}
      <div className="relative overflow-hidden h-36 bg-gradient-to-br from-pink-100/90 via-fuchsia-100/80 via-30% to-orange-100/70 dark:from-cyan-900/60 dark:via-violet-900/70 dark:via-30% dark:to-blue-900/60">
        {/* Floating Abstract Shapes - GPU optimized with transform3d */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="absolute -top-24 -left-12 w-96 h-96 bg-gradient-to-br from-pink-400 to-fuchsia-500 dark:from-cyan-400 dark:to-violet-500 rounded-full blur-3xl opacity-25 dark:opacity-30"
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="absolute -bottom-24 -right-12 w-[32rem] h-[32rem] bg-gradient-to-br from-fuchsia-400 to-orange-500 dark:from-violet-400 dark:to-blue-500 rounded-full blur-3xl opacity-30 dark:opacity-35"
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        />
        <motion.div
          animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-orange-400 to-pink-500 dark:from-blue-400 dark:to-cyan-500 rounded-full blur-3xl opacity-20 dark:opacity-25"
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-600 dark:from-cyan-400 dark:via-violet-400 dark:to-blue-400 bg-clip-text text-transparent mb-1.5">
            Study Center
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
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
              className="group card-hover p-5 text-left transition-[border-color,transform] duration-200 active:scale-95 hover:border-pink-500 dark:hover:border-cyan-500"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500/10 to-orange-500/10 dark:from-cyan-500/10 dark:to-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-pink-500/20 dark:border-cyan-500/20">
                  <FolderOpen className="w-6 h-6 text-pink-600 dark:text-cyan-400" />
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
              className="group card-hover p-5 text-left transition-[border-color,transform] duration-200 active:scale-95 hover:border-fuchsia-500 dark:hover:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 dark:from-violet-500/10 dark:to-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-fuchsia-500/20 dark:border-violet-500/20">
                  <UploadCloud className="w-6 h-6 text-fuchsia-600 dark:text-violet-400" />
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
                    className="w-full flex items-center gap-4 p-4 card-hover transition-[border-color,transform] duration-200 group hover:border-pink-500/50 dark:hover:border-violet-500/50"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 dark:from-violet-500/20 dark:to-cyan-500/20 rounded-xl flex items-center justify-center border border-pink-500/20 dark:border-violet-500/20">
                      <FileText className="w-6 h-6 text-pink-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-heading group-hover:text-pink-600 dark:group-hover:text-violet-400 transition-colors">
                        {file.originalName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <FileTypeBadge mimeType={file.fileType} />
                        <span className="text-sm text-muted">
                          {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-pink-600 dark:group-hover:text-cyan-400 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-500/10 to-fuchsia-500/10 dark:from-cyan-500/10 dark:to-violet-500/10 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-pink-600 dark:text-cyan-400" />
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

      {/* YouTube Processing Overlay */}
      <YouTubeProcessingOverlay
        isOpen={isProcessingYouTube}
        onCancel={handleCancelYouTubeProcessing}
        videoTitle={processingVideoTitle}
      />
    </div>
  );
}
