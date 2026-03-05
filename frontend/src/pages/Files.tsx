import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FileText,
  BookOpen,
  Upload,
  Sparkles,
  MoreVertical,
  Eye,
  Download,
  Edit2,
  Trash2,
  Search,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FileTypeBadge, getFileIcon } from '@/lib/fileTypeUtils';
import UploadModal, { type RecordingUploadPayload } from '@/components/UploadModal';
import YouTubeProcessingOverlay from '@/components/YouTubeProcessingOverlay';
import { useLayout } from '@/contexts/LayoutContext';
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

interface FolderType {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderType[];
  files: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

interface UploadedFile {
  id: string;
  fileName: string;
  downloadUrl?: string | null;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  folderId: string | null;
  createdAt: string;
}

interface UploadMutationResult {
  files: UploadedFile[];
  processingPending: boolean;
  failedFiles: Array<{ name: string; error: string }>;
}

interface RecordingUploadResult {
  file?: UploadedFile;
  warning?: string;
  limitedFeatures?: boolean;
  transcriptionSource?: string;
}

export default function Files() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setHideSidebar, setCustomHeaderContent } = useLayout();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessingYouTube, setIsProcessingYouTube] = useState(false);
  const [processingVideoTitle, setProcessingVideoTitle] = useState<string | undefined>();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'folder' | 'file';
    id: string;
    name: string;
  } | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [selectedItem, setSelectedItem] = useState<{
    type: 'folder' | 'file';
    id: string;
    name: string;
  } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
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

  // Fetch folders
  const { data: foldersData, isLoading: loadingFolders } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await api.get('/study/folders');
      return response.data;
    },
    enabled: hasAuthToken,
  });

  // Fetch files
  const { data: filesData, isLoading: loadingFiles } = useQuery({
    queryKey: ['study-files'],
    queryFn: async () => {
      const response = await api.get('/study/files');
      return response.data;
    },
    enabled: hasAuthToken,
  });

  const folders: FolderType[] = foldersData?.folders || [];
  const allFiles: UploadedFile[] = filesData?.files || [];

  const foldersById = useMemo(() => {
    return new Map(folders.map((folder) => [folder.id, folder]));
  }, [folders]);

  const folderPath = useMemo(() => {
    const pathItems: FolderType[] = [];
    let cursorId = currentFolderId;
    let safetyCounter = 0;

    while (cursorId && safetyCounter < 100) {
      const folder = foldersById.get(cursorId);
      if (!folder) break;
      pathItems.unshift(folder);
      cursorId = folder.parentId;
      safetyCounter += 1;
    }

    return pathItems;
  }, [currentFolderId, foldersById]);

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
    mutationFn: async ({ files, targetFolderId }: { files: FileList; targetFolderId: string | null }) => {
      const fileList = Array.from(files);
      const totalFileBytes = fileList.reduce((sum, file) => sum + Math.max(1, file.size), 0);

      setUploadProgress(createQueuedUploadProgress(fileList));

      const formData = new FormData();
      fileList.forEach((file) => formData.append('files', file));
      if (targetFolderId) formData.append('folderId', targetFolderId);

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
    onSuccess: (result: UploadMutationResult) => {
      setUploadError(null);
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });

      if (result.processingPending) {
        toast.success('Files uploaded. Processing continues in the background.');
      } else {
        toast.success('Files uploaded successfully!');
      }

      if (result.failedFiles.length > 0) {
        const failedNames = result.failedFiles.map((failed) => failed.name).join(', ');
        toast.error(`Some files could not be uploaded: ${failedNames}`);
      }
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Upload failed');
      setUploadError(message);
      setUploadProgress(null);
      toast.error(message);
    },
  });

  const recordingUploadMutation = useMutation({
    mutationFn: async ({
      payload,
      targetFolderId,
    }: {
      payload: RecordingUploadPayload;
      targetFolderId: string | null;
    }) => {
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
      if (targetFolderId) formData.append('folderId', targetFolderId);

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

      return {
        file: response.data?.file as UploadedFile | undefined,
        warning:
          typeof response.data?.warning === 'string' ? response.data.warning : undefined,
        limitedFeatures: Boolean(response.data?.limitedFeatures),
        transcriptionSource:
          typeof response.data?.transcriptionSource === 'string'
            ? response.data.transcriptionSource
            : undefined,
      } as RecordingUploadResult;
    },
    onSuccess: async (result: RecordingUploadResult) => {
      setUploadError(null);
      setUploadProgress(null);
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      await queryClient.invalidateQueries({ queryKey: ['folders'] });

      if (result.warning) {
        toast.success('Recording uploaded.');
        toast.error(result.warning, { duration: 8000 });
      } else if (result.transcriptionSource === 'gemini-audio') {
        toast.success('Recording uploaded and auto-transcribed!');
      } else {
        toast.success('Recording uploaded successfully!');
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

  // Delete mutations
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/study/folders/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder deleted');
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/study/files/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
      toast.success('File deleted');
    },
  });

  // Mass delete mutation
  const massDeleteMutation = useMutation({
    mutationFn: async (items: { type: 'folder' | 'file'; id: string }[]) => {
      const promises = items.map((item) => {
        const url =
          item.type === 'folder' ? `/study/folders/${item.id}` : `/study/files/${item.id}`;
        return api.delete(url);
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
      setSelectedItems(new Set());
      toast.success('Items deleted successfully');
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/study/folders', { name, parentId: currentFolderId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setShowCreateFolderModal(false);
      setNewFolderName('');
      toast.success('Folder created successfully');
    },
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async (data: { type: 'folder' | 'file'; id: string; name: string }) => {
      const url =
        data.type === 'folder'
          ? `/study/folders/${data.id}`
          : `/study/files/${data.id}/rename`;
      const body =
        data.type === 'folder' ? { name: data.name } : { originalName: data.name };

      const response = await api.patch(url, body);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [variables.type === 'folder' ? 'folders' : 'study-files'],
      });
      setShowRenameModal(false);
      setSelectedItem(null);
      toast.success('Renamed successfully');
    },
  });

  // Get current folder's subfolders and files
  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentFiles = allFiles.filter((f) => f.folderId === currentFolderId);

  // Filter by search
  const filteredFolders = currentFolders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = currentFiles.filter((f) =>
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const startUpload = (files: FileList) => {
    if (files.length === 0) return;
    setUploadError(null);
    setUploadProgress(null);
    uploadMutation.mutate({ files, targetFolderId: currentFolderId });
  };

  const openUploadHub = () => {
    setUploadError(null);
    setUploadProgress(null);
    setShowUploadModal(true);
  };

  // Handlers
  const handleUploadFiles = (files: FileList) => {
    startUpload(files);
  };

  const handleUploadYouTube = async (url: string) => {
    setIsProcessingYouTube(true);
    setProcessingVideoTitle(undefined);
    
    try {
      const response = await api.post('/study/upload-youtube', { url, folderId: currentFolderId });
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
      await queryClient.invalidateQueries({ queryKey: ['folders'] });
      if (response.data?.file?.id) {
        navigate(`/study/${response.data.file.id}`);
      }
    } catch (error: any) {
      setIsProcessingYouTube(false);
      const message = error?.response?.data?.error || 'Failed to add YouTube video';
      toast.error(message);
    }
  };

  const handleUploadRecording = async (payload: RecordingUploadPayload) => {
    setUploadError(null);
    try {
      await recordingUploadMutation.mutateAsync({
        payload,
        targetFolderId: currentFolderId,
      });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Recording upload failed'));
    }
  };

  const handleUploadLink = async (url: string) => {
    try {
      const response = await api.post('/study/upload-link', { url, folderId: currentFolderId });
      toast.success('Web link imported!');

      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      await queryClient.invalidateQueries({ queryKey: ['folders'] });

      if (response.data?.file?.id) {
        navigate(`/study/${response.data.file.id}`);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to import web link';
      toast.error(message);
    }
  };

  const handleCancelYouTubeProcessing = () => {
    setIsProcessingYouTube(false);
    toast('Processing cancelled - the video may still be added', { icon: '⚠️' });
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    type: 'folder' | 'file',
    id: string,
    name: string
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id, name });
  };

  const handleRename = () => {
    if (!contextMenu) return;
    setSelectedItem({
      type: contextMenu.type,
      id: contextMenu.id,
      name: contextMenu.name,
    });
    setRenameValue(contextMenu.name);
    setShowRenameModal(true);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    if (confirm(`Are you sure you want to delete "${contextMenu.name}"?`)) {
      if (contextMenu.type === 'folder') {
        deleteFolderMutation.mutate(contextMenu.id);
      } else {
        deleteFileMutation.mutate(contextMenu.id);
      }
    }
    setContextMenu(null);
  };

  const getFileUrl = (file: UploadedFile) => {
    const relativeUrl =
      file.downloadUrl || (file.fileName ? `/uploads/${encodeURIComponent(file.fileName)}` : null);

    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http')) return relativeUrl;
    if (import.meta.env.DEV && relativeUrl.startsWith('/')) return relativeUrl;

    const apiBase = (import.meta.env.VITE_API_URL as string) || '/api';
    const assetBase = apiBase.replace(/\/_?api\/?$/, '');
    return `${assetBase}${relativeUrl}`;
  };

  const openFileInNewTab = (targetFile: UploadedFile) => {
    const fileUrl = getFileUrl(targetFile);
    if (!fileUrl) {
      toast.error('Unable to open this file');
      return;
    }

    const openedWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      toast.error('Popup blocked. Please allow popups and try again.');
    }
  };

  const openFileInStudy = (targetFile: UploadedFile) => {
    if (!targetFile?.id) {
      toast.error('File not found');
      return;
    }

    navigate(`/study/${targetFile.id}`);
  };

  const handleViewFile = () => {
    if (!contextMenu || contextMenu.type !== 'file') return;

    const targetFile = allFiles.find((file) => file.id === contextMenu.id);
    if (!targetFile) {
      toast.error('File not found');
      setContextMenu(null);
      return;
    }

    openFileInNewTab(targetFile);

    setContextMenu(null);
  };

  const handleDownloadFile = () => {
    if (!contextMenu || contextMenu.type !== 'file') return;

    const targetFile = allFiles.find((file) => file.id === contextMenu.id);
    if (!targetFile) {
      toast.error('File not found');
      setContextMenu(null);
      return;
    }

    const fileUrl = getFileUrl(targetFile);
    if (!fileUrl) {
      toast.error('Unable to download this file');
      setContextMenu(null);
      return;
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = targetFile.originalName || targetFile.fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setContextMenu(null);
  };

  const handleFileDoubleClick = (fileId: string) => {
    const targetFile = allFiles.find((file) => file.id === fileId);
    if (!targetFile) {
      toast.error('File not found');
      return;
    }

    openFileInStudy(targetFile);
  };

  const handleStudyFile = () => {
    if (!contextMenu || contextMenu.type !== 'file') return;

    const targetFile = allFiles.find((file) => file.id === contextMenu.id);
    if (!targetFile) {
      toast.error('File not found');
      setContextMenu(null);
      return;
    }

    openFileInStudy(targetFile);
    setContextMenu(null);
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      startUpload(files);
    }
  };

  const handleGoBackFolder = () => {
    if (!currentFolderId) return;
    const currentFolder = foldersById.get(currentFolderId);
    setCurrentFolderId(currentFolder?.parentId ?? null);
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredFiles.length + filteredFolders.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set([
        ...filteredFolders.map(f => `folder-${f.id}`),
        ...filteredFiles.map(f => `file-${f.id}`)
      ]);
      setSelectedItems(allIds);
    }
  };

  const handleMassDelete = () => {
    const itemsToDelete = Array.from(selectedItems).map(id => {
      const [type, itemId] = id.split('-');
      return { type: type as 'folder' | 'file', id: itemId };
    });

    if (confirm(`Are you sure you want to delete ${itemsToDelete.length} item(s)?`)) {
      massDeleteMutation.mutate(itemsToDelete);
    }
  };

  const isLoading = loadingFolders || loadingFiles;

  return (
    <>
      <Helmet>
        <title>Files - Thynkr</title>
        <meta name="description" content="Manage your study files and folders" />
      </Helmet>

      <div
        onClick={() => setContextMenu(null)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="min-h-app bg-slate-50 dark:bg-slate-950 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      >
        {/* Drag and Drop Overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-pink-500/20 dark:bg-cyan-500/20 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 border-4 border-dashed border-pink-500 dark:border-cyan-500 rounded-3xl p-12 text-center">
              <Upload className="w-20 h-20 text-pink-600 dark:text-cyan-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Drop files here</h3>
              <p className="text-slate-600 dark:text-slate-400">Release to upload</p>
            </div>
          </div>
        )}
        {/* Main Container */}
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Library
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {filteredFiles.length + filteredFolders.length} items • Organized and ready to study
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <button
                  onClick={handleGoBackFolder}
                  disabled={!currentFolderId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="flex flex-wrap items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Root
                  </button>

                  {folderPath.map((folder) => (
                    <div key={folder.id} className="inline-flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5" />
                      <button
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {folder.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Search Bar - Integrated Design */}
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-white dark:bg-slate-900/80 backdrop-blur-md border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-cyan-500 focus:border-pink-500 dark:focus:border-cyan-500 transition-all duration-200 shadow-md hover:shadow-lg"
                />
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="mb-6 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
            </div>
          )}

          {/* Premium Create New Study Set Hero */}
          <motion.button
            type="button"
            onClick={openUploadHub}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.currentTarget === e.target) {
                setIsDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                startUpload(files);
              }
            }}
            whileHover={{ scale: 1.004 }}
            className="w-full mb-8 rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-black p-6 sm:p-8 shadow-xl text-left relative overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_10%,rgba(236,72,153,0.14),transparent_35%),radial-gradient(circle_at_88%_14%,rgba(168,85,247,0.16),transparent_35%),radial-gradient(circle_at_50%_88%,rgba(59,130,246,0.15),transparent_40%)] dark:bg-[radial-gradient(circle_at_10%_10%,rgba(168,85,247,0.24),transparent_35%),radial-gradient(circle_at_88%_14%,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_50%_88%,rgba(34,211,238,0.2),transparent_40%)]" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-400/15 border border-violet-500/20 dark:border-violet-300/30 text-xs font-semibold text-violet-700 dark:text-violet-300 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Create New Study Set
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Drop Files or Open Upload Hub</h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                  Drag files directly onto this hero (or anywhere on the page), or click here for Files, YouTube, and Paste Text uploads.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold shadow-lg shadow-violet-500/30">
                <Upload className="w-5 h-5" />
                Open Upload Hub
              </div>
            </div>
          </motion.button>

          {/* Selection Toolbar */}
          <AnimatePresence>
            {selectedItems.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-full shadow-2xl z-30 flex items-center gap-4"
              >
                <span className="font-bold text-cyan-400 dark:text-cyan-600 text-lg">{selectedItems.size} selected</span>
                <div className="w-px h-6 bg-white/20 dark:bg-slate-900/20" />
                <button
                  onClick={handleSelectAll}
                  className="text-sm hover:text-pink-300 dark:hover:text-cyan-400 transition-colors"
                >
                  {selectedItems.size === filteredFiles.length + filteredFolders.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleMassDelete}
                  disabled={massDeleteMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-sm hover:text-pink-300 dark:hover:text-cyan-400 transition-colors"
                >
                  Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Folders Grid */}
          <div className="min-h-[200px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm uppercase text-slate-500 font-semibold tracking-wider">
                Folders
              </h2>
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-sm font-medium"
              >
                <Folder className="w-4 h-4" />
                <span>New Folder</span>
              </button>
            </div>
            {filteredFolders.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <AnimatePresence>
                  {filteredFolders.map((folder, index) => (
                    <motion.button
                      key={folder.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.1, ease: [0.25, 0.1, 0.25, 1.0] }}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                      className="group bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-700/60 backdrop-blur-sm border-2 border-slate-200 dark:border-white/5 rounded-xl p-4 text-left transition-all duration-100 hover:scale-[1.02] active:scale-95 will-change-transform shadow-md hover:shadow-lg"
                    >
                      <Folder className="w-12 h-12 text-amber-500 dark:text-amber-400 mb-2" fill="currentColor" />
                      <p className="text-slate-900 dark:text-white font-medium truncate text-sm">{folder.name}</p>
                      <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                        {folder.files?.length || 0} files
                      </p>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Files List - Modern Table Design */}
          {(isLoading || filteredFiles.length > 0) && (
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border-2 border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden min-h-[400px] shadow-lg">
              {/* Table Header - Sticky (Hidden on mobile) */}
              <div className="hidden md:grid grid-cols-[40px_40px_1fr_120px_120px_80px_40px] gap-4 px-6 py-4 border-b-2 border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-400 sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.size > 0 && selectedItems.size === filteredFiles.length}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 checked:bg-pink-600 dark:checked:bg-cyan-500 checked:border-pink-600 dark:checked:border-cyan-500 cursor-pointer"
                  />
                </div>
                <div></div>
                <div>Name</div>
                <div className="text-center">Type</div>
                <div className="text-center">Date</div>
                <div className="text-right">Size</div>
                <div></div>
              </div>

              {/* File Rows */}
              {isLoading ? (
                <div className="divide-y divide-slate-200/50 dark:divide-white/5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-[40px_40px_1fr_40px] md:grid-cols-[40px_40px_1fr_120px_120px_80px_40px] gap-3 md:gap-4 items-center px-4 md:px-6 py-3 md:py-4 animate-pulse min-h-[64px]">
                      <div className="flex justify-center"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                      <div className="flex justify-center"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="hidden md:flex justify-center"><div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" /></div>
                      <div className="hidden md:flex justify-center"><div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                      <div className="hidden md:flex justify-end"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                      <div className="flex justify-center"><div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-200/50 dark:divide-white/5">
                  <AnimatePresence>
                    {filteredFiles.map((file, index) => {
                      const { icon: FileIcon, color: iconColor } = getFileIcon(file.fileType, file.originalName);
                      const isSelected = selectedItems.has(`file-${file.id}`);
                      
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.02, duration: 0.15 }}
                          onDoubleClick={() => handleFileDoubleClick(file.id)}
                          onContextMenu={(e) => handleContextMenu(e, 'file', file.id, file.originalName)}
                          className={`group grid grid-cols-[40px_40px_1fr_40px] md:grid-cols-[40px_40px_1fr_120px_120px_80px_40px] gap-3 md:gap-4 items-center px-4 md:px-6 py-3 md:py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer min-h-[64px] will-change-transform active:scale-[0.99] border-b border-slate-100 dark:border-white/5 last:border-0 ${isSelected ? 'bg-pink-50 dark:bg-cyan-500/10' : ''}`}
                        >
                          {/* Checkbox */}
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(`file-${file.id}`)}
                              className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 checked:bg-pink-600 dark:checked:bg-cyan-500 checked:border-pink-600 dark:checked:border-cyan-500 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Icon */}
                          <div className="flex items-center justify-center">
                            <FileIcon className={`w-5 h-5 ${iconColor}`} />
                          </div>

                          {/* Name */}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {file.originalName}
                            </p>
                            {/* Show type and size on mobile below name */}
                            <div className="flex md:hidden items-center gap-2 mt-1">
                              <FileTypeBadge mimeType={file.fileType} fileName={file.originalName} />
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {formatFileSize(file.fileSize)}
                              </span>
                            </div>
                          </div>

                          {/* Type Badge (Hidden on mobile) */}
                          <div className="hidden md:flex justify-center">
                            <FileTypeBadge mimeType={file.fileType} fileName={file.originalName} />
                          </div>

                          {/* Date (Hidden on mobile) */}
                          <div className="hidden md:flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(file.createdAt)}</span>
                          </div>

                          {/* Size (Hidden on mobile) */}
                          <div className="hidden md:block text-right text-sm font-mono text-slate-600 dark:text-slate-400">
                            {formatFileSize(file.fileSize)}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, 'file', file.id, file.originalName);
                              }}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors duration-150 active:scale-95 will-change-transform"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
          {/* Empty State */}
          {!isLoading && filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border-2 border-slate-200 dark:border-white/10 rounded-2xl p-16 text-center min-h-[400px] flex items-center justify-center shadow-lg">
              <div>
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {searchQuery ? 'No results found' : 'No files yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery ? 'Try adjusting your search' : 'Upload your first file to get started'}
              </p>
              </div>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-2 z-50 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'file' && (
              <>
                <button
                  onClick={handleStudyFile}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-150 flex items-center gap-3 active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  Study
                </button>
                <button
                  onClick={handleViewFile}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-150 flex items-center gap-3 active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-150 flex items-center gap-3 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </>
            )}
            <button
              onClick={handleRename}
              className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-150 flex items-center gap-3 active:scale-95"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 flex items-center gap-3 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* Rename Modal */}
        {showRenameModal && selectedItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Rename {selectedItem.type === 'folder' ? 'Folder' : 'File'}
              </h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-cyan-500 focus:border-pink-500 dark:focus:border-cyan-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRenameModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedItem && renameValue.trim()) {
                      renameMutation.mutate({
                        type: selectedItem.type,
                        id: selectedItem.id,
                        name: renameValue.trim(),
                      });
                    }
                  }}
                  disabled={!renameValue.trim() || renameMutation.isPending}
                  className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 hover:shadow-xl text-white rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95 shadow-sm"
                >
                  {renameMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Folder Modal */}
        {showCreateFolderModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Create New Folder
              </h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-cyan-500 focus:border-pink-500 dark:focus:border-cyan-500 mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    createFolderMutation.mutate(newFolderName.trim());
                  }
                }}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newFolderName.trim()) {
                      createFolderMutation.mutate(newFolderName.trim());
                    }
                  }}
                  disabled={!newFolderName.trim() || createFolderMutation.isPending}
                  className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 hover:shadow-xl text-white rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95 shadow-sm"
                >
                  {createFolderMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

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
          currentFolderId={currentFolderId}
          uploadErrorMessage={uploadError}
        />

        {/* YouTube Processing Overlay */}
        <YouTubeProcessingOverlay
          isOpen={isProcessingYouTube}
          onCancel={handleCancelYouTubeProcessing}
          videoTitle={processingVideoTitle}
        />
      </div>
    </>
  );
}
