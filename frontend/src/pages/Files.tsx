import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import PageContainer from '@/components/layout/PageContainer';
import { FileListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import {
  Folder as FolderIcon,
  FolderPlus,
  FileText,
  Upload,
  MoreVertical,
  Edit2,
  Trash2,
  Move,
  Search,
  ChevronRight,
  Home,
  FileIcon,
  X,
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTierAccess } from '@/components/UpgradePrompt';
import StudyPackViewer from '@/features/study/StudyPackViewer';
import api from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children: Folder[];
  files: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  folderId: string | null;
  createdAt: string;
}

export default function Files() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasStandardAccess } = useTierAccess(user?.role);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedItem, setSelectedItem] = useState<{
    type: 'folder' | 'file';
    id: string;
    name: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'folder' | 'file';
    id: string;
    name: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Multi-select for Study Packs
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [showStudyPackModal, setShowStudyPackModal] = useState(false);
  const [studyPackTitle, setStudyPackTitle] = useState('');
  const [studyPackQuizCount, setStudyPackQuizCount] = useState(10);
  const [studyPackCardsCount, setStudyPackCardsCount] = useState(15);
  const [creatingStudyPack, setCreatingStudyPack] = useState(false);
  const [activeStudyPackId, setActiveStudyPackId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('accessToken');

  // Fetch all folders and files
  const { data: foldersData, isLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/folders`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  const { data: filesData } = useQuery({
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
  });

  const folders: Folder[] = foldersData?.folders || [];
  const allFiles: UploadedFile[] = filesData?.files || [];

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; parentId: string | null }) => {
      const response = await fetch(`${API_URL}/study/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create folder');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setShowNewFolderModal(false);
      setNewFolderName('');
    },
  });

  // Rename folder mutation
  const renameFolderMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const response = await fetch(`${API_URL}/study/folders/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: data.name }),
      });
      if (!response.ok) throw new Error('Failed to rename folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setShowRenameModal(false);
      setSelectedItem(null);
    },
  });

  // Rename file mutation
  const renameFileMutation = useMutation({
    mutationFn: async (data: { id: string; originalName: string }) => {
      const response = await fetch(`${API_URL}/study/files/${data.id}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ originalName: data.originalName }),
      });
      if (!response.ok) throw new Error('Failed to rename file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
      setShowRenameModal(false);
      setSelectedItem(null);
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/study/folders/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete folder');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/study/files/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
    },
  });

  // Move file mutation
  const moveFileMutation = useMutation({
    mutationFn: async (data: { fileId: string; folderId: string | null }) => {
      const response = await fetch(`${API_URL}/study/files/${data.fileId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ folderId: data.folderId }),
      });
      if (!response.ok) throw new Error('Failed to move file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
      setShowMoveModal(false);
      setSelectedItem(null);
    },
  });

  // Toggle file selection for multi-file study
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFileIds(new Set());
  }, []);

  // Create study pack mutation (for general uploads - no courseId)
  const createStudyPackMutation = useMutation({
    mutationFn: async (data: {
      fileIds: string[];
      title: string;
      quiz: { count: number };
      cards: { count: number };
    }) => {
      const response = await api.post('/ai/study-pack', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Study Pack created!');
      setShowStudyPackModal(false);
      setActiveStudyPackId(data.studyPack.id);
      clearSelection();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create study pack');
    },
  });

  const handleStartStudyPack = useCallback(() => {
    if (selectedFileIds.size < 2) {
      toast.error('Select at least 2 files to create a study pack');
      return;
    }
    // Generate default title from selected files
    const selectedFiles = allFiles.filter((f: UploadedFile) => selectedFileIds.has(f.id));
    const defaultTitle =
      selectedFiles.length <= 3
        ? selectedFiles
            .map((f: UploadedFile) => f.originalName.replace(/\.[^/.]+$/, ''))
            .join(' + ')
        : `${selectedFiles.length} Files Study Pack`;
    setStudyPackTitle(defaultTitle.slice(0, 100));
    setShowStudyPackModal(true);
  }, [selectedFileIds, allFiles]);

  const handleCreateStudyPack = () => {
    if (selectedFileIds.size < 2) return;
    setCreatingStudyPack(true);
    createStudyPackMutation.mutate(
      {
        fileIds: Array.from(selectedFileIds),
        title: studyPackTitle.trim() || 'Study Pack',
        quiz: { count: studyPackQuizCount },
        cards: { count: studyPackCardsCount },
      },
      {
        onSettled: () => setCreatingStudyPack(false),
      }
    );
  };

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
    },
  });

  // Get current folder
  const currentFolder = currentFolderId ? folders.find((f) => f.id === currentFolderId) : null;

  // Get folders in current directory
  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);

  // Get files in current directory
  const currentFiles = allFiles.filter((f) => f.folderId === currentFolderId);

  // Select all completed files in current folder
  const selectAllCurrentFiles = useCallback(() => {
    const completedFiles = currentFiles.filter((f) => f.status === 'COMPLETED');
    setSelectedFileIds(new Set(completedFiles.map((f) => f.id)));
  }, [currentFiles]);

  // Filter by search
  const filteredFolders = currentFolders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = currentFiles.filter((f) =>
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build breadcrumb
  const buildBreadcrumb = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Home' }];
    let folder = currentFolder;
    while (folder) {
      crumbs.unshift({ id: folder.id, name: folder.name });
      folder = folders.find((f) => f.id === folder!.parentId) || null;
    }
    return crumbs;
  };

  const breadcrumb = buildBreadcrumb();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
    if (contextMenu) {
      setSelectedItem({ type: contextMenu.type, id: contextMenu.id, name: contextMenu.name });
      setShowRenameModal(true);
      setContextMenu(null);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      if (confirm(`Are you sure you want to delete "${contextMenu.name}"?`)) {
        if (contextMenu.type === 'folder') {
          deleteFolderMutation.mutate(contextMenu.id);
        } else {
          deleteFileMutation.mutate(contextMenu.id);
        }
      }
      setContextMenu(null);
    }
  };

  const handleMove = () => {
    if (contextMenu && contextMenu.type === 'file') {
      setSelectedItem({ type: 'file', id: contextMenu.id, name: contextMenu.name });
      setShowMoveModal(true);
      setContextMenu(null);
    }
  };

  const handleOpenFile = (fileId: string) => {
    navigate(`/study?file=${fileId}`);
  };

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

  const handleFileDragStart = (e: React.DragEvent, fileId: string) => {
    e.stopPropagation();
    setDraggedFile(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFileDragEnd = () => {
    setDraggedFile(null);
    setDropTarget(null);
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    if (draggedFile) {
      e.preventDefault();
      e.stopPropagation();
      setDropTarget(folderId);
    }
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFile) {
      moveFileMutation.mutate({ fileId: draggedFile, folderId });
      setDraggedFile(null);
      setDropTarget(null);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-6"
      >
        <PageContainer>
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-md" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
            {/* Upload area skeleton */}
            <Skeleton className="h-32 w-full rounded-lg" />
            {/* Folders skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            {/* Files skeleton */}
            <FileListSkeleton count={5} />
          </div>
        </PageContainer>
      </motion.div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Files - Thynkr</title>
        <meta
          name="description"
          content="Manage your study files and folders with Thynkr's file organization system"
        />
      </Helmet>

      <div onClick={() => setContextMenu(null)}>
      <PageContainer>
        <PageContainer.Header
          subtitle="Manage your study files and folders"
          actions={
            <div className="p-2 bg-gradient-to-br from-brand-600 to-accent-600 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
          }
        >
          Files
        </PageContainer.Header>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Upload
              className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}
            />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PDF, DOC/DOCX, TXT, or PowerPoint files
            </p>
            {uploadMutation.isPending && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Uploading...</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.pps,.ppsx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Toolbar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 items-center">
                {/* Multi-select actions - only for Standard+ */}
                {hasStandardAccess && selectedFileIds.size > 0 && (
                  <>
                    <span className="text-sm text-primary-600 dark:text-primary-400">
                      {selectedFileIds.size} selected
                    </span>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleStartStudyPack}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
                    >
                      <Sparkles className="w-4 h-4" />
                      Study Together
                    </button>
                  </>
                )}
                {hasStandardAccess &&
                  filteredFiles.filter((f) => f.status === 'COMPLETED').length >= 2 &&
                  selectedFileIds.size === 0 && (
                    <button
                      onClick={selectAllCurrentFiles}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Select All
                    </button>
                  )}
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FolderPlus className="w-5 h-5" />
                  New Folder
                </button>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mt-4 text-sm">
              {breadcrumb.map((crumb, index) => (
                <div key={crumb.id || 'home'} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                      crumb.id === currentFolderId
                        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {index === 0 && <Home className="w-4 h-4" />}
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Folders */}
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                onDoubleClick={() => setCurrentFolderId(folder.id)}
                onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                onDragLeave={handleFolderDragLeave}
                onDrop={(e) => handleFolderDrop(e, folder.id)}
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 hover:shadow-md transition-all cursor-pointer group ${
                  dropTarget === folder.id
                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FolderIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {folder.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {folder.files.length} file{folder.files.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, 'folder', folder.id, folder.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}

            {/* Files */}
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                draggable={selectedFileIds.size === 0}
                onDragStart={(e) => handleFileDragStart(e, file.id)}
                onDragEnd={handleFileDragEnd}
                onContextMenu={(e) => handleContextMenu(e, 'file', file.id, file.originalName)}
                onDoubleClick={() => handleOpenFile(file.id)}
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 hover:shadow-md transition-all group ${
                  selectedFileIds.has(file.id)
                    ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : draggedFile === file.id
                      ? 'opacity-50 border-blue-500 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500'
                } ${selectedFileIds.size === 0 ? 'cursor-move' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Selection Checkbox for Standard+ users */}
                    {hasStandardAccess && file.status === 'COMPLETED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(file.id);
                        }}
                        className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex-shrink-0"
                      >
                        {selectedFileIds.has(file.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <FileText className="w-10 h-10 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.originalName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.fileSize)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                          file.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : file.status === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {file.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, 'file', file.id, file.originalName);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filteredFolders.length === 0 && filteredFiles.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                {searchQuery ? (
                  <p>No files or folders found matching "{searchQuery}"</p>
                ) : (
                  <>
                    <FileIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">This folder is empty</p>
                    <p className="text-sm">Upload files or create folders to get started</p>
                  </>
                )}
              </div>
            )}
          </div>
      </PageContainer>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={handleRename}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </button>
          {contextMenu.type === 'file' && (
            <button
              onClick={handleMove}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <Move className="w-4 h-4" />
              Move to Folder
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Folder
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createFolderMutation.mutate({ name: newFolderName, parentId: currentFolderId });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    createFolderMutation.mutate({ name: newFolderName, parentId: currentFolderId });
                  }
                }}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rename {selectedItem.type === 'folder' ? 'Folder' : 'File'}
              </h3>
              <button
                onClick={() => setShowRenameModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              defaultValue={selectedItem.name}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newName = (e.target as HTMLInputElement).value.trim();
                  if (newName) {
                    if (selectedItem.type === 'folder') {
                      renameFolderMutation.mutate({ id: selectedItem.id, name: newName });
                    } else {
                      renameFileMutation.mutate({ id: selectedItem.id, originalName: newName });
                    }
                  }
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  const newName = input?.value.trim();
                  if (newName) {
                    if (selectedItem.type === 'folder') {
                      renameFolderMutation.mutate({ id: selectedItem.id, name: newName });
                    } else {
                      renameFileMutation.mutate({ id: selectedItem.id, originalName: newName });
                    }
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move File Modal */}
      {showMoveModal && selectedItem && selectedItem.type === 'file' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Move to Folder
              </h3>
              <button
                onClick={() => setShowMoveModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {/* Root */}
              <button
                onClick={() => {
                  moveFileMutation.mutate({ fileId: selectedItem.id, folderId: null });
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Home className="w-5 h-5 text-gray-400" />
                <span>Home (Root)</span>
              </button>
              {/* Folders */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    moveFileMutation.mutate({ fileId: selectedItem.id, folderId: folder.id });
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  style={{ paddingLeft: `${(folder.parentId ? 2 : 1) * 1.5}rem` }}
                >
                  <FolderIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Study Pack Creation Modal */}
      {showStudyPackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Create Study Pack
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedFileIds.size} files selected
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStudyPackModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Study Pack Title
                </label>
                <input
                  type="text"
                  value={studyPackTitle}
                  onChange={(e) => setStudyPackTitle(e.target.value)}
                  placeholder="Enter a title for your study pack"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz Questions
                  </label>
                  <select
                    value={studyPackQuizCount}
                    onChange={(e) => setStudyPackQuizCount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                    <option value={20}>20 questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Flashcards
                  </label>
                  <select
                    value={studyPackCardsCount}
                    onChange={(e) => setStudyPackCardsCount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={10}>10 cards</option>
                    <option value={15}>15 cards</option>
                    <option value={20}>20 cards</option>
                    <option value={30}>30 cards</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <Sparkles className="h-4 w-4 inline mr-1" />
                  AI will combine content from all selected files to create a unified study
                  experience with paginated summaries, quiz, and flashcards.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowStudyPackModal(false)}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStudyPack}
                  disabled={creatingStudyPack || !studyPackTitle.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25"
                >
                  {creatingStudyPack ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Create Study Pack
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Study Pack Viewer */}
      {activeStudyPackId && (
        <StudyPackViewer
          studyPackId={activeStudyPackId}
          onClose={() => setActiveStudyPackId(null)}
        />
      )}
    </>
  );
}
