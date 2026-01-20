import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FileText,
  Upload,
  MoreVertical,
  Edit2,
  Trash2,
  Search,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FileTypeBadge, getFileIcon } from '@/lib/fileTypeUtils';
import UploadModal from '@/components/UploadModal';
import { useLayout } from '@/contexts/LayoutContext';
import api from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  const { setHideSidebar, setCustomHeaderContent } = useLayout();
  const [showUploadModal, setShowUploadModal] = useState(false);
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

  // CRITICAL: Reset layout on mount
  useEffect(() => {
    setHideSidebar(false);
    setCustomHeaderContent(null);
  }, [setHideSidebar, setCustomHeaderContent]);

  const getToken = () => localStorage.getItem('accessToken');

  // Fetch folders
  const { data: foldersData, isLoading: loadingFolders } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/folders`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    },
  });

  // Fetch files
  const { data: filesData, isLoading: loadingFiles } = useQuery({
    queryKey: ['study-files'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/files`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
  });

  const folders: FolderType[] = foldersData?.folders || [];
  const allFiles: UploadedFile[] = filesData?.files || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      if (currentFolderId) formData.append('folderId', currentFolderId);

      const response = await fetch(`${API_URL}/study/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
      toast.success('Files uploaded successfully!');
    },
  });

  // Delete mutations
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/study/folders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder deleted');
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/study/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to delete file');
      return response.json();
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
        const url = item.type === 'folder' 
          ? `${API_URL}/study/folders/${item.id}`
          : `${API_URL}/study/files/${item.id}`;
        return fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        });
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
      const response = await fetch(`${API_URL}/study/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name, parentId: currentFolderId }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
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
          ? `${API_URL}/study/folders/${data.id}`
          : `${API_URL}/study/files/${data.id}/rename`;
      const body =
        data.type === 'folder' ? { name: data.name } : { originalName: data.name };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to rename');
      return response.json();
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

  // Handlers
  const handleUploadFiles = (files: FileList) => {
    uploadMutation.mutate(files);
    setShowUploadModal(false);
  };

  const handleUploadYouTube = async (url: string) => {
    setShowUploadModal(false);
    try {
      await api.post('/study/upload-youtube', { url, folderId: currentFolderId });
      queryClient.invalidateQueries({ queryKey: ['study-files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('YouTube video added successfully');
    } catch (error) {
      console.error('YouTube upload error:', error);
      toast.error('Failed to add YouTube video');
    }
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

  const handleFileDoubleClick = (fileId: string) => {
    navigate(`/study?file=${fileId}`);
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
      uploadMutation.mutate(files);
    }
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
        className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      >
        {/* Drag and Drop Overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 border-4 border-dashed border-blue-500 rounded-3xl p-12 text-center">
              <Upload className="w-20 h-20 text-blue-500 mx-auto mb-4" />
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
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Bar - Integrated Design */}
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-white dark:bg-slate-900/80 backdrop-blur-md border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                />
              </div>

              {/* Upload Button - Premium Design */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="group relative px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 will-change-transform"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  <span className="hidden sm:inline whitespace-nowrap">Upload</span>
                </div>
              </button>
            </div>
          </div>

          {/* Selection Toolbar */}
          <AnimatePresence>
            {selectedItems.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-full shadow-2xl z-30 flex items-center gap-4"
              >
                <span className="font-semibold">{selectedItems.size} selected</span>
                <div className="w-px h-6 bg-white/20 dark:bg-slate-900/20" />
                <button
                  onClick={handleSelectAll}
                  className="text-sm hover:text-blue-300 dark:hover:text-blue-600 transition-colors"
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
                  className="text-sm hover:text-blue-300 dark:hover:text-blue-600 transition-colors"
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
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
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
              {/* Table Header - Sticky */}
              <div className="grid grid-cols-[40px_40px_1fr_120px_120px_80px_40px] gap-4 px-6 py-4 border-b-2 border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-400 sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.size > 0 && selectedItems.size === filteredFiles.length}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 checked:bg-blue-600 checked:border-blue-600 cursor-pointer"
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
                    <div key={i} className="grid grid-cols-[40px_40px_1fr_120px_120px_80px_40px] gap-4 items-center px-6 py-4 animate-pulse min-h-[64px]">
                      <div className="flex justify-center"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                      <div className="flex justify-center"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="flex justify-center"><div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" /></div>
                      <div className="flex justify-center"><div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                      <div className="flex justify-end"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></div>
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
                          className={`group grid grid-cols-[40px_40px_1fr_120px_120px_80px_40px] gap-4 items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer min-h-[64px] will-change-transform active:scale-[0.99] border-b border-slate-100 dark:border-white/5 last:border-0 ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}
                        >
                          {/* Checkbox */}
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(`file-${file.id}`)}
                              className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 checked:bg-blue-600 checked:border-blue-600 cursor-pointer"
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
                          </div>

                          {/* Type Badge */}
                          <div className="flex justify-center">
                            <FileTypeBadge mimeType={file.fileType} fileName={file.originalName} />
                          </div>

                          {/* Date */}
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(file.createdAt)}</span>
                          </div>

                          {/* Size */}
                          <div className="text-right text-sm font-mono text-slate-600 dark:text-slate-400">
                            {formatFileSize(file.fileSize)}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95 shadow-sm"
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
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95 shadow-sm"
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
          onUploadYouTube={handleUploadYouTube}
          isUploading={uploadMutation.isPending}
          currentFolderId={currentFolderId}
        />
      </div>
    </>
  );
}
