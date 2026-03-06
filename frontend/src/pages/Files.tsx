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
  MoreVertical,
  Eye,
  Download,
  Edit2,
  Trash2,
  Search,
  Calendar,
  FolderInput,
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
  sourceUrl?: string | null;
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

type LibraryItemType = 'folder' | 'file';

interface LibraryItemReference {
  type: LibraryItemType;
  id: string;
  name: string;
}

interface DraggedLibraryItem extends LibraryItemReference {
  parentFolderId: string | null;
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
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: LibraryItemType;
    id: string;
    name: string;
  } | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [selectedItem, setSelectedItem] = useState<LibraryItemReference | null>(null);
  const [moveItem, setMoveItem] = useState<LibraryItemReference | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DraggedLibraryItem | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
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
    mutationFn: async (items: { type: LibraryItemType; id: string }[]) => {
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
    mutationFn: async (data: { type: LibraryItemType; id: string; name: string }) => {
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

  const moveItemMutation = useMutation({
    mutationFn: async (payload: { type: LibraryItemType; id: string; folderId: string | null }) => {
      const url =
        payload.type === 'folder'
          ? `/study/folders/${payload.id}/move`
          : `/study/files/${payload.id}/move`;

      const response = await api.patch(url, { folderId: payload.folderId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
      setShowMoveModal(false);
      setMoveItem(null);
      setMoveTargetFolderId(null);
      toast.success('Moved successfully');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to move item'));
    },
  });

  // Get current folder's subfolders and files
  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentFiles = allFiles.filter((f) => f.folderId === currentFolderId);

  // Filter by search
  const filteredFolders = useMemo(
    () =>
      currentFolders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [currentFolders, searchQuery]
  );
  const filteredFiles = useMemo(
    () =>
      currentFiles.filter((f) => f.originalName.toLowerCase().includes(searchQuery.toLowerCase())),
    [currentFiles, searchQuery]
  );

  const sortedFolders = useMemo(() => {
    const items = [...filteredFolders];

    if (sortBy === 'name') {
      return items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [filteredFolders, sortBy]);

  const sortedFiles = useMemo(() => {
    const items = [...filteredFiles];

    if (sortBy === 'name') {
      return items.sort((a, b) => a.originalName.localeCompare(b.originalName));
    }

    if (sortBy === 'size') {
      return items.sort((a, b) => b.fileSize - a.fileSize);
    }

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredFiles, sortBy]);

  const getDateGroup = (dateString: string): string => {
    const input = new Date(dateString);
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const inputDayStart = new Date(input.getFullYear(), input.getMonth(), input.getDate());
    const diffDays = Math.floor((dayStart.getTime() - inputDayStart.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return input.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupedFiles = useMemo(() => {
    const groups = new Map<string, UploadedFile[]>();

    sortedFiles.forEach((file) => {
      const label = getDateGroup(file.createdAt);
      const existing = groups.get(label) || [];
      existing.push(file);
      groups.set(label, existing);
    });

    const orderedLabels = Array.from(groups.keys()).sort((a, b) => {
      const score = (label: string) => {
        if (label === 'Today') return 2;
        if (label === 'Yesterday') return 1;
        return 0;
      };

      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.localeCompare(b);
    });

    return orderedLabels.map((label) => ({
      label,
      items: groups.get(label) || [],
    }));
  }, [sortedFiles]);

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

  const getFolderDisplayPath = (folderId: string) => {
    const parts: string[] = [];
    let cursor: FolderType | undefined = foldersById.get(folderId);
    let safetyCounter = 0;

    while (cursor && safetyCounter < 100) {
      parts.unshift(cursor.name);
      cursor = cursor.parentId ? foldersById.get(cursor.parentId) : undefined;
      safetyCounter += 1;
    }

    return parts.join(' / ');
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

  const openContextMenuAt = (x: number, y: number, item: LibraryItemReference) => {
    setContextMenu({ x, y, ...item });
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    type: LibraryItemType,
    id: string,
    name: string
  ) => {
    e.preventDefault();
    openContextMenuAt(e.clientX, e.clientY, { type, id, name });
  };

  const handleMenuButtonClick = (
    e: React.MouseEvent<HTMLElement>,
    item: LibraryItemReference
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const bounds = e.currentTarget.getBoundingClientRect();
    openContextMenuAt(bounds.left, bounds.bottom + 6, item);
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

  const getItemParentFolderId = (item: LibraryItemReference): string | null => {
    if (item.type === 'file') {
      return allFiles.find((file) => file.id === item.id)?.folderId ?? null;
    }

    return foldersById.get(item.id)?.parentId ?? null;
  };

  const getFolderDescendantIds = (folderId: string): Set<string> => {
    const descendants = new Set<string>();
    const queue: string[] = [folderId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      folders
        .filter((folder) => folder.parentId === currentId)
        .forEach((folder) => {
          if (!descendants.has(folder.id)) {
            descendants.add(folder.id);
            queue.push(folder.id);
          }
        });
    }

    return descendants;
  };

  const isStructurallyInvalidMoveTarget = (
    item: LibraryItemReference,
    targetFolderId: string | null
  ) => {
    if (item.type !== 'folder') {
      return false;
    }

    if (targetFolderId === item.id) {
      return true;
    }

    if (targetFolderId && getFolderDescendantIds(item.id).has(targetFolderId)) {
      return true;
    }

    return false;
  };

  const canMoveItemToFolder = (
    item: LibraryItemReference,
    targetFolderId: string | null,
    sourceFolderId?: string | null
  ) => {
    const currentParentId = sourceFolderId ?? getItemParentFolderId(item);

    if (currentParentId === targetFolderId) {
      return false;
    }

    if (isStructurallyInvalidMoveTarget(item, targetFolderId)) {
      return false;
    }

    return true;
  };

  const moveItemToFolder = (
    item: LibraryItemReference,
    targetFolderId: string | null,
    sourceFolderId?: string | null
  ) => {
    if (!canMoveItemToFolder(item, targetFolderId, sourceFolderId)) {
      if (item.type === 'folder') {
        toast.error('Invalid folder destination');
      }
      return;
    }

    moveItemMutation.mutate({
      type: item.type,
      id: item.id,
      folderId: targetFolderId,
    });
  };

  const handleOpenMoveModal = () => {
    if (!contextMenu) return;
    const item: LibraryItemReference = {
      type: contextMenu.type,
      id: contextMenu.id,
      name: contextMenu.name,
    };

    setMoveItem(item);
    setMoveTargetFolderId(getItemParentFolderId(item));
    setShowMoveModal(true);
    setContextMenu(null);
  };

  const handleConfirmMove = () => {
    if (!moveItem) return;
    moveItemToFolder(moveItem, moveTargetFolderId);
  };

  const isExternalResourceFile = (file: UploadedFile): boolean => {
    const type = String(file.fileType || '').toLowerCase();
    const hasExternalSourceUrl =
      typeof file.sourceUrl === 'string' && /^https?:\/\//i.test(file.sourceUrl);

    return hasExternalSourceUrl || type.includes('youtube') || type.includes('text/url');
  };

  const canDownloadFile = (file: UploadedFile): boolean => {
    if (isExternalResourceFile(file)) {
      return false;
    }

    return Boolean(file.downloadUrl || file.fileName);
  };

  const getFileUrl = (file: UploadedFile, options?: { forDownload?: boolean }) => {
    const forDownload = Boolean(options?.forDownload);

    if (isExternalResourceFile(file)) {
      if (forDownload) return null;
      if (typeof file.sourceUrl === 'string' && /^https?:\/\//i.test(file.sourceUrl)) {
        return file.sourceUrl;
      }
      return null;
    }

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

    if (!canDownloadFile(targetFile)) {
      toast.error('This source can be opened, but it is not downloadable');
      setContextMenu(null);
      return;
    }

    const fileUrl = getFileUrl(targetFile, { forDownload: true });
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

  const hasDraggedFiles = (e: React.DragEvent) => {
    return Array.from(e.dataTransfer.types || []).includes('Files');
  };

  const handleItemDragStart = (
    e: React.DragEvent,
    item: LibraryItemReference,
    parentFolderId: string | null
  ) => {
    setDraggedItem({ ...item, parentFolderId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${item.type}:${item.id}`);
  };

  const handleItemDragEnd = () => {
    setDraggedItem(null);
    setDragOverFolderId(null);
  };

  const handleFolderDragOver = (e: React.DragEvent, targetFolderId: string) => {
    if (!draggedItem) return;
    if (!canMoveItemToFolder(draggedItem, targetFolderId, draggedItem.parentFolderId)) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(targetFolderId);
  };

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string) => {
    if (!draggedItem) return;

    e.preventDefault();
    e.stopPropagation();

    moveItemToFolder(draggedItem, targetFolderId, draggedItem.parentFolderId);
    setDraggedItem(null);
    setDragOverFolderId(null);
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasDraggedFiles(e)) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (hasDraggedFiles(e)) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!hasDraggedFiles(e)) {
      return;
    }

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
    if (selectedItems.size === sortedFiles.length + sortedFolders.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set([
        ...sortedFolders.map(f => `folder-${f.id}`),
        ...sortedFiles.map(f => `file-${f.id}`)
      ]);
      setSelectedItems(allIds);
    }
  };

  const handleMassDelete = () => {
    const itemsToDelete = Array.from(selectedItems).map(id => {
      const [type, itemId] = id.split('-');
      return { type: type as LibraryItemType, id: itemId };
    });

    if (confirm(`Are you sure you want to delete ${itemsToDelete.length} item(s)?`)) {
      massDeleteMutation.mutate(itemsToDelete);
    }
  };

  const moveItemCurrentParentId = useMemo(() => {
    if (!moveItem) return null;
    return getItemParentFolderId(moveItem);
  }, [moveItem, allFiles, foldersById]);

  const moveTargetOptions = useMemo(() => {
    if (!moveItem) return folders;
    return folders.filter((folder) => !isStructurallyInvalidMoveTarget(moveItem, folder.id));
  }, [folders, moveItem]);

  const isMoveDestinationUnchanged = moveItemCurrentParentId === moveTargetFolderId;

  const contextMenuFile =
    contextMenu?.type === 'file' ? allFiles.find((file) => file.id === contextMenu.id) || null : null;
  const canDownloadContextMenuFile = contextMenuFile ? canDownloadFile(contextMenuFile) : false;

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="rounded-3xl border border-stone-200 dark:border-white/10 bg-white/90 dark:bg-black/70 backdrop-blur-md shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] p-4 sm:p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 font-semibold">
                  Study Workspace
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  File Library
                </h1>
                <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">
                  {sortedFiles.length + sortedFolders.length} items in this view
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                <Calendar className="w-3.5 h-3.5" />
                Sorted by {sortBy === 'recent' ? 'recent' : sortBy}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 h-12 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-slate-500"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'size')}
                className="h-12 min-w-[160px] rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-slate-900/60 px-3 text-sm text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-slate-500"
                aria-label="Sort files"
              >
                <option value="recent">Sort: Last Added</option>
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
              </select>

              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="h-12 px-4 rounded-xl border border-stone-300 dark:border-white/20 bg-white dark:bg-slate-900/60 text-stone-700 dark:text-stone-200 text-sm font-semibold hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
              >
                + Folder
              </button>

              <button
                type="button"
                onClick={openUploadHub}
                className="h-12 px-5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                onClick={handleGoBackFolder}
                disabled={!currentFolderId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-stone-700 dark:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex flex-wrap items-center gap-1.5 text-stone-500 dark:text-stone-400">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Root
                </button>

                {folderPath.map((folder) => (
                  <div key={folder.id} className="inline-flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
              </div>
            )}

            <AnimatePresence>
              {selectedItems.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-slate-900/60 px-4 py-3 flex flex-wrap items-center gap-3"
                >
                  <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                    {selectedItems.size} selected
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
                  >
                    {selectedItems.size === sortedFiles.length + sortedFolders.length ? 'Deselect all' : 'Select all'}
                  </button>
                  <button
                    onClick={handleMassDelete}
                    disabled={massDeleteMutation.isPending}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedItems(new Set())}
                    className="text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
                  >
                    Clear
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div>
                <h2 className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 font-semibold mb-3">
                  Folders
                </h2>
                {sortedFolders.length > 0 ? (
                  <div className="space-y-2">
                    {sortedFolders.map((folder, index) => {
                      const isSelected = selectedItems.has(`folder-${folder.id}`);
                      const isDragOverTarget = dragOverFolderId === folder.id;

                      return (
                        <motion.div
                          key={folder.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.015, duration: 0.12 }}
                          onClick={() => setCurrentFolderId(folder.id)}
                          onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                          draggable
                          onDragStartCapture={(e) =>
                            handleItemDragStart(
                              e,
                              { type: 'folder', id: folder.id, name: folder.name },
                              folder.parentId
                            )
                          }
                          onDragEndCapture={handleItemDragEnd}
                          onDragOverCapture={(e) => handleFolderDragOver(e, folder.id)}
                          onDragLeaveCapture={() => {
                            setDragOverFolderId((previous) => (previous === folder.id ? null : previous));
                          }}
                          onDropCapture={(e) => handleFolderDrop(e, folder.id)}
                          className={`w-full grid grid-cols-[28px_1fr_auto_32px] items-center gap-3 rounded-xl px-3 sm:px-4 py-3 border transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-stone-400 dark:border-slate-400 bg-stone-100 dark:bg-slate-800'
                              : isDragOverTarget
                                ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                                : 'border-stone-200 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:bg-stone-50 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <Folder className="w-5 h-5 text-amber-500" fill="currentColor" />
                          <div className="text-left min-w-0">
                            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{folder.name}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">{folder.files?.length || 0} files</p>
                          </div>
                          <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">{formatDate(folder.updatedAt)}</span>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleMenuButtonClick(e, {
                                type: 'folder',
                                id: folder.id,
                                name: folder.name,
                              })
                            }
                            className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-slate-700"
                            aria-label={`Open folder actions for ${folder.name}`}
                          >
                            <MoreVertical className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-stone-200 dark:border-white/10 px-4 py-3 text-sm text-stone-500 dark:text-stone-400">
                    No folders in this location.
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xs uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 font-semibold mb-3">
                  Files
                </h2>

                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-14 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-slate-900/60 animate-pulse" />
                    ))}
                  </div>
                ) : groupedFiles.length > 0 ? (
                  <div className="space-y-5">
                    {groupedFiles.map((group) => (
                      <div key={group.label} className="space-y-2">
                        <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">{group.label}</p>
                        <div className="space-y-2">
                          {group.items.map((file, index) => {
                            const { icon: FileIcon, color: iconColor } = getFileIcon(file.fileType, file.originalName);
                            const isSelected = selectedItems.has(`file-${file.id}`);

                            return (
                              <motion.div
                                key={file.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.015, duration: 0.12 }}
                                draggable
                                onDragStartCapture={(e) =>
                                  handleItemDragStart(
                                    e,
                                    { type: 'file', id: file.id, name: file.originalName },
                                    file.folderId
                                  )
                                }
                                onDragEndCapture={handleItemDragEnd}
                                onDoubleClick={() => handleFileDoubleClick(file.id)}
                                onContextMenu={(e) => handleContextMenu(e, 'file', file.id, file.originalName)}
                                className={`group grid grid-cols-[24px_28px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 sm:px-4 py-3 border cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'border-stone-400 dark:border-slate-400 bg-stone-100 dark:bg-slate-800'
                                    : 'border-stone-200 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:bg-stone-50 dark:hover:bg-slate-800/80'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelection(`file-${file.id}`)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-stone-300 dark:border-slate-600"
                                />

                                <FileIcon className={`w-5 h-5 ${iconColor}`} />

                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{file.originalName}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <FileTypeBadge mimeType={file.fileType} fileName={file.originalName} />
                                    <span className="text-xs text-stone-500 dark:text-stone-400">{formatDate(file.createdAt)}</span>
                                    <span className="text-xs text-stone-500 dark:text-stone-400">{formatFileSize(file.fileSize)}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    handleMenuButtonClick(e, {
                                      type: 'file',
                                      id: file.id,
                                      name: file.originalName,
                                    });
                                  }}
                                  className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-slate-700"
                                >
                                  <MoreVertical className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                                </button>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-200 dark:border-white/10 p-10 text-center">
                    <div className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-7 h-7 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                      {searchQuery ? 'No results found' : 'No files yet'}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                      {searchQuery ? 'Try a different search.' : 'Upload your first study material to get started.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                {canDownloadContextMenuFile && (
                  <button
                    onClick={handleDownloadFile}
                    className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-150 flex items-center gap-3 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleOpenMoveModal}
              className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-150 flex items-center gap-3 active:scale-95"
            >
              <FolderInput className="w-4 h-4" />
              Move to folder
            </button>
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

        {/* Move Modal */}
        {showMoveModal && moveItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Move {moveItem.type === 'folder' ? 'Folder' : 'File'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Choose where to move <span className="font-medium">{moveItem.name}</span>
              </p>

              <label
                htmlFor="move-target-folder"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Destination
              </label>
              <select
                id="move-target-folder"
                value={moveTargetFolderId ?? '__ROOT__'}
                onChange={(e) =>
                  setMoveTargetFolderId(e.target.value === '__ROOT__' ? null : e.target.value)
                }
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-cyan-500 focus:border-pink-500 dark:focus:border-cyan-500 mb-4"
              >
                <option value="__ROOT__">Root</option>
                {moveTargetOptions.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {getFolderDisplayPath(folder.id)}
                  </option>
                ))}
              </select>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowMoveModal(false);
                    setMoveItem(null);
                    setMoveTargetFolderId(null);
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMove}
                  disabled={moveItemMutation.isPending || isMoveDestinationUnchanged}
                  className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 hover:shadow-xl text-white rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95 shadow-sm"
                >
                  {moveItemMutation.isPending ? 'Moving...' : 'Move'}
                </button>
              </div>
            </motion.div>
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
          enableRecordingTab={true}
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
