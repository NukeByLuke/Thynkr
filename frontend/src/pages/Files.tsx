import { useState, useRef } from 'react';
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
  File,
  Calendar,
  HardDrive,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'pdf') return { icon: FileText, color: 'text-red-500' };
    if (['doc', 'docx'].includes(type)) return { icon: FileText, color: 'text-blue-500' };
    if (['ppt', 'pptx'].includes(type)) return { icon: FileText, color: 'text-orange-500' };
    return { icon: File, color: 'text-slate-400' };
  };

  // Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files);
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

  const isLoading = loadingFolders || loadingFiles;

  // Skeleton component for loading state
  const FileListSkeleton = () => (
    <div className="space-y-1">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 rounded-lg border-b border-white/5"
        >
          <div className="w-5 h-5 bg-slate-800 rounded animate-pulse" />
          <div className="flex-1 h-4 bg-slate-800 rounded animate-pulse" />
          <div className="w-16 h-4 bg-slate-800 rounded animate-pulse" />
          <div className="w-24 h-4 bg-slate-800 rounded animate-pulse" />
          <div className="w-16 h-4 bg-slate-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Files - Thynkr</title>
        <meta name="description" content="Manage your study files and folders" />
      </Helmet>

      <div
        onClick={() => setContextMenu(null)}
        className="min-h-screen bg-slate-950 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      >
        {/* Main Container */}
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-white">Library</h1>
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-12 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-full text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="px-4 py-2.5 bg-white text-slate-950 rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.pps,.ppsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Folders Grid */}
          {filteredFolders.length > 0 && (
            <div>
              <h2 className="text-sm uppercase text-slate-500 font-semibold mb-4 tracking-wider">
                Folders
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <AnimatePresence>
                  {filteredFolders.map((folder, index) => (
                    <motion.button
                      key={folder.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                      className="group bg-slate-800/40 hover:bg-slate-700/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Folder className="w-12 h-12 text-amber-400 mb-2" fill="currentColor" />
                      <p className="text-white font-medium truncate text-sm">{folder.name}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        {folder.files?.length || 0} files
                      </p>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Files List - Spotify Style */}
          {(isLoading || filteredFiles.length > 0) && (
            <div>
              <h2 className="text-sm uppercase text-slate-500 font-semibold mb-4 tracking-wider">
                Files
              </h2>

              {/* Table Header - Sticky */}
              <div className="grid grid-cols-[40px_1fr_140px_120px_100px_50px] gap-4 px-4 pb-3 border-b border-white/5 text-xs uppercase text-slate-500 font-medium tracking-wider sticky top-0 bg-slate-950 z-10">
                <div className="text-center">#</div>
                <div>Name</div>
                <div>Type</div>
                <div>Date Added</div>
                <div className="text-right">Size</div>
                <div></div>
              </div>

              {/* File List */}
              {isLoading ? (
                <FileListSkeleton />
              ) : (
                <div className="mt-2 space-y-1">
                  <AnimatePresence>
                    {filteredFiles.map((file, index) => {
                      const { icon: IconComponent, color } = getFileIcon(file.fileType);
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.02 }}
                          onDoubleClick={() => handleFileDoubleClick(file.id)}
                          onContextMenu={(e) =>
                            handleContextMenu(e, 'file', file.id, file.originalName)
                          }
                          className="group grid grid-cols-[40px_1fr_140px_120px_100px_50px] gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer"
                        >
                          {/* Icon */}
                          <div className="flex items-center justify-center">
                            <IconComponent className={`w-5 h-5 ${color}`} />
                          </div>

                          {/* Name */}
                          <div className="overflow-hidden">
                            <p className="text-slate-200 font-medium truncate">
                              {file.originalName}
                            </p>
                          </div>

                          {/* Type */}
                          <div className="text-slate-500 text-sm uppercase font-mono">
                            {file.fileType}
                          </div>

                          {/* Date */}
                          <div className="text-slate-500 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(file.createdAt)}
                          </div>

                          {/* Size */}
                          <div className="text-slate-500 text-sm text-right font-mono flex items-center justify-end gap-2">
                            <HardDrive className="w-4 h-4" />
                            {formatFileSize(file.fileSize)}
                          </div>

                          {/* Actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, 'file', file.id, file.originalName);
                              }}
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5 text-slate-400" />
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
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-400 mb-2">
                {searchQuery ? 'No results found' : 'No files yet'}
              </h3>
              <p className="text-slate-500">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Upload your first file to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-slate-900 border border-white/10 rounded-lg shadow-2xl py-2 z-50 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleRename}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-3"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
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
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                Rename {selectedItem.type === 'folder' ? 'Folder' : 'File'}
              </h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRenameModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
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
                  className="px-6 py-2 bg-white text-slate-950 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {renameMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
