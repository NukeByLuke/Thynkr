/**
 * Study Page - Study Center Dashboard
 * Modern, abstract design with floating shapes and split-action cards.
 * Layout: Abstract Header → Action Grid → Recent Files
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '@/contexts/LayoutContext';
import { AnimatePresence, motion } from 'framer-motion';
import { UploadCloud, FolderOpen, FileText, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileTypeBadge } from '@/lib/fileTypeUtils';
import UploadModal, { type RecordingUploadPayload } from '@/components/UploadModal';
import YouTubeProcessingOverlay from '@/components/YouTubeProcessingOverlay';
import api from '@/lib/api';
import {
  buildUploadProgressSnapshot,
  createServerProcessingUploadProgress,
  createQueuedUploadProgress,
  hasStudyUploadFailures,
  isStudyUploadProcessingComplete,
  type StudyUploadServerFile,
  type UploadProgressSnapshot,
} from '@/lib/uploadProgress';

interface UploadedFile {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

interface UploadMutationResult {
  files: UploadedFile[];
  processingPending: boolean;
  failedFiles: Array<{ name: string; error: string }>;
}

export default function Study() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setHideSidebar, setCustomHeaderContent } = useLayout();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessingYouTube, setIsProcessingYouTube] = useState(false);
  const [processingVideoTitle, setProcessingVideoTitle] = useState<string | undefined>();
  const [isDraggingToCreate, setIsDraggingToCreate] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressSnapshot | null>(null);

  // CRITICAL: Reset layout on mount
  useEffect(() => {
    setHideSidebar(false);
    setCustomHeaderContent(null);
  }, [setHideSidebar, setCustomHeaderContent]);

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    const maybeError = error as any;
    return (
      maybeError?.response?.data?.error ||
      maybeError?.response?.data?.message ||
      maybeError?.message ||
      fallback
    );
  };

  const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const hasAuthToken = Boolean(localStorage.getItem('accessToken'));

  // Fetch uploaded files
  const { data: filesData, isLoading } = useQuery({
    queryKey: ['study-files'],
    queryFn: async () => {
      const response = await api.get('/study/files');
      return response.data;
    },
    enabled: hasAuthToken,
  });

  const files: UploadedFile[] = filesData?.files || [];

  // Get 3 most recent files for "Jump Back In"
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const waitForUploadedFilesToProcess = async (
    selectedFiles: File[],
    initialUploadedFiles: StudyUploadServerFile[]
  ): Promise<boolean> => {
    if (!selectedFiles.length || !initialUploadedFiles.length) {
      return false;
    }

    let trackedFiles = [...initialUploadedFiles];
    const startedAt = Date.now();
    const processingTimeoutMs = 45000;

    while (true) {
      const elapsedMs = Date.now() - startedAt;
      setUploadProgress(createServerProcessingUploadProgress(selectedFiles, trackedFiles, elapsedMs));

      if (hasStudyUploadFailures(trackedFiles)) {
        throw new Error('One or more files failed during processing. Please re-upload and try again.');
      }

      if (isStudyUploadProcessingComplete(trackedFiles)) {
        return false;
      }

      if (elapsedMs >= processingTimeoutMs) {
        return true;
      }

      await delay(1000);
      try {
        const statusResponse = await api.get('/study/files');
        const latestFiles: UploadedFile[] = Array.isArray(statusResponse.data?.files)
          ? statusResponse.data.files
          : [];
        const statusById = new Map(latestFiles.map((file) => [file.id, file.status]));

        trackedFiles = trackedFiles.map((file) => ({
          ...file,
          status: statusById.get(file.id) || file.status,
        }));
      } catch {
        return true;
      }
    }
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const fileList = Array.from(files);
      const totalFileBytes = fileList.reduce((sum, file) => sum + Math.max(1, file.size), 0);

      setUploadProgress(createQueuedUploadProgress(fileList));

      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post('/study/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const loaded = typeof progressEvent.loaded === 'number' ? progressEvent.loaded : 0;
          const total =
            typeof progressEvent.total === 'number' && progressEvent.total > 0
              ? progressEvent.total
              : totalFileBytes;

          const normalizedLoadedBytes =
            total > 0
              ? Math.min(totalFileBytes, (loaded / total) * totalFileBytes)
              : Math.min(totalFileBytes, loaded);

          setUploadProgress(
            buildUploadProgressSnapshot(fileList, normalizedLoadedBytes, 'uploading')
          );
        },
      });

      const uploadedFiles: UploadedFile[] = Array.isArray(response.data?.files)
        ? response.data.files
        : [];
      const rawFailedFiles: unknown[] = Array.isArray(response.data?.failedFiles)
        ? response.data.failedFiles
        : [];
      const failedFiles: Array<{ name: string; error: string }> = rawFailedFiles
        .map((entry: any): { name: string; error: string } => ({
          name: typeof entry?.name === 'string' ? entry.name : 'Unknown file',
          error: typeof entry?.error === 'string' ? entry.error : 'Upload failed',
        }))
        .filter((entry: { name: string; error: string }) => entry.name.trim().length > 0);
      const processingPending = await waitForUploadedFilesToProcess(fileList, uploadedFiles);

      return {
        files: uploadedFiles,
        processingPending,
        failedFiles,
      } as UploadMutationResult;
    },
    onSuccess: async (data: UploadMutationResult) => {
      setUploadError(null);
      setUploadProgress(null);
      // Refetch immediately to show new files
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      await queryClient.refetchQueries({ queryKey: ['study-files'] });

      if (data.processingPending) {
        toast.success('Upload complete. Processing continues in the background.');
      }

      if (data.failedFiles.length > 0) {
        const failedNames = data.failedFiles.map((failed) => failed.name).join(', ');
        toast.error(`Some files could not be uploaded: ${failedNames}`);
      }

      // Auto-navigate to the first uploaded file
      if (data.files && data.files.length > 0) {
        navigate(`/study/${data.files[0].id}`);
      }
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Upload failed');
      setUploadError(message);
      setUploadProgress(null);
      toast.error(message);
      console.error('Upload error:', error);
    },
  });

  const recordingUploadMutation = useMutation({
    mutationFn: async (payload: RecordingUploadPayload) => {
      const { audioFile, transcript, timeline, capturedAt, durationSeconds } = payload;
      const fileList = [audioFile];
      const totalFileBytes = Math.max(1, audioFile.size);

      setUploadProgress(createQueuedUploadProgress(fileList));

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('transcript', transcript);
      formData.append('timeline', JSON.stringify(timeline));
      formData.append('capturedAt', capturedAt);
      formData.append('durationSeconds', String(Math.max(0, Math.floor(durationSeconds || 0))));

      const response = await api.post('/study/upload-recording', formData, {
        onUploadProgress: (progressEvent) => {
          const loaded = typeof progressEvent.loaded === 'number' ? progressEvent.loaded : 0;
          const total =
            typeof progressEvent.total === 'number' && progressEvent.total > 0
              ? progressEvent.total
              : totalFileBytes;

          const normalizedLoadedBytes =
            total > 0
              ? Math.min(totalFileBytes, (loaded / total) * totalFileBytes)
              : Math.min(totalFileBytes, loaded);

          setUploadProgress(
            buildUploadProgressSnapshot(fileList, normalizedLoadedBytes, 'uploading')
          );
        },
      });

      return response.data?.file as UploadedFile | undefined;
    },
    onSuccess: async (file?: UploadedFile) => {
      setUploadError(null);
      setUploadProgress(null);
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      await queryClient.refetchQueries({ queryKey: ['study-files'] });
      toast.success('Recording uploaded successfully!');

      if (file?.id) {
        navigate(`/study/${file.id}`);
      }
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Recording upload failed');
      setUploadError(message);
      setUploadProgress(null);
      toast.error(message);
      console.error('Recording upload error:', error);
    },
  });

  const handleQuickUpload = () => {
    setUploadError(null);
    setUploadProgress(null);
    setShowUploadModal(true);
  };

  const handleUploadFiles = (files: FileList) => {
    setUploadError(null);
    uploadMutation.mutate(files);
  };

  const handleUploadRecording = async (payload: RecordingUploadPayload) => {
    setUploadError(null);
    try {
      await recordingUploadMutation.mutateAsync(payload);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Recording upload failed'));
    }
  };

  const handleUploadYouTube = async (url: string) => {
    setIsProcessingYouTube(true);
    setProcessingVideoTitle(undefined);
    
    try {
      const response = await api.post('/study/upload-youtube', { url });
      setIsProcessingYouTube(false);
      
      // Check if there's a warning about limited transcript extraction
      if (response.data?.warning) {
        toast.success('Video added!', { duration: 2000 });
        toast.error(response.data.warning, { duration: 8000 });
      } else {
        toast.success('YouTube video ready!');
      }
      
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

  const handleUploadLink = async (url: string) => {
    try {
      const response = await api.post('/study/upload-link', { url });
      toast.success('Web link imported!');

      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      if (response.data?.file?.id) {
        navigate(`/study/${response.data.file.id}`);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to import web link';
      toast.error(message);
    }
  };

  const handleCancelYouTubeProcessing = () => {
    // Note: We can't actually cancel the API call, but we can hide the overlay
    // The request will complete in the background
    setIsProcessingYouTube(false);
    toast('Processing cancelled - the video may still be added', { icon: '⚠️' });
  };

  const handlePageDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingToCreate(true);
  };

  const handlePageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDraggingToCreate(false);
    }
  };

  const handlePageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingToCreate(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUploadFiles(files);
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      onDragEnter={handlePageDragEnter}
      onDragOver={handlePageDragOver}
      onDragLeave={handlePageDragLeave}
      onDrop={handlePageDrop}
    >
      <AnimatePresence>
        {isDraggingToCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-violet-500/15 dark:bg-violet-400/20 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              className="rounded-3xl border-2 border-dashed border-violet-500 dark:border-violet-300 bg-white/95 dark:bg-black/90 px-10 py-12 text-center shadow-2xl"
            >
              <UploadCloud className="w-14 h-14 mx-auto mb-3 text-violet-600 dark:text-violet-300" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Drop to Create Study Set</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Release your files to start upload and processing</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abstract Header - Elegant Aurora Theme */}
      <div className="relative overflow-hidden h-36 bg-gradient-to-br from-pink-100/90 via-fuchsia-100/80 via-30% to-orange-100/70 dark:from-cyan-900/60 dark:via-violet-900/70 dark:via-30% dark:to-blue-900/60">
        <div className="absolute -top-24 -left-12 w-96 h-96 bg-gradient-to-br from-pink-400 to-fuchsia-500 dark:from-cyan-400 dark:to-violet-500 rounded-full blur-3xl opacity-20 dark:opacity-25" />
        <div className="absolute -bottom-24 -right-12 w-[32rem] h-[32rem] bg-gradient-to-br from-fuchsia-400 to-orange-500 dark:from-violet-400 dark:to-blue-500 rounded-full blur-3xl opacity-25 dark:opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-orange-400 to-pink-500 dark:from-blue-400 dark:to-cyan-500 rounded-full blur-3xl opacity-15 dark:opacity-20" />

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

          {/* Premium Create New Study Set Hero */}
          <motion.button
            type="button"
            onClick={handleQuickUpload}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingToCreate(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.currentTarget === e.target) {
                setIsDraggingToCreate(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingToCreate(false);
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                handleUploadFiles(files);
              }
            }}
            whileHover={{ scale: 1.005 }}
            className="w-full mb-8 rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-black p-6 sm:p-8 shadow-xl text-left relative overflow-hidden group"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_12%_10%,rgba(236,72,153,0.15),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_50%_88%,rgba(59,130,246,0.16),transparent_40%)] dark:bg-[radial-gradient(circle_at_12%_10%,rgba(168,85,247,0.25),transparent_35%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_50%_88%,rgba(34,211,238,0.22),transparent_40%)]" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-400/15 border border-violet-500/20 dark:border-violet-300/30 text-xs font-semibold text-violet-700 dark:text-violet-300 mb-3">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Premium Upload
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Create New Study Set</h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                  Drag files directly onto this page or click to open the Upload Hub with files, web links, YouTube, and text import.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold shadow-lg shadow-violet-500/30">
                <UploadCloud className="w-5 h-5" />
                Open Upload Hub
              </div>
            </div>
          </motion.button>

          {/* Action Cards - Minimal */}
          <div className="grid grid-cols-1 gap-4 mb-10">
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
                  <button
                    key={file.id}
                    onClick={() => navigate(`/study/${file.id}`)}
                    className="w-full flex items-center gap-4 p-4 card-hover transition-[border-color,transform] duration-150 group hover:border-pink-500/50 dark:hover:border-violet-500/50 hover:translate-x-1 active:scale-[0.99]"
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
                  </button>
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
        onUploadRecording={handleUploadRecording}
        onUploadYouTube={handleUploadYouTube}
        onUploadLink={handleUploadLink}
        isUploading={uploadMutation.isPending || recordingUploadMutation.isPending}
        uploadProgress={uploadProgress}
        uploadErrorMessage={uploadError}
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
