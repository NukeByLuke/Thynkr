import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Folder,
  FileText,
  Upload,
  MoreVertical,
  Edit2,
  Trash2,
  Search,
  File,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Files - Thynkr</title>
        <meta name="description" content="Manage your study files and folders" />
      </Helmet>

      <div
        onClick={() => setContextMenu(null)}
        className="min-h-screen bg-slate-50 dark:bg-slate-950"
      >
        {/* Main Container */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Library</h1>
              
              {/* Action Buttons - Small & Minimal */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
            
            {/* Search Bar - Minimal */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
              />
            </div>
          </div>

          {/* File Tree - Google Drive Style */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {/* Folders */}
            {filteredFolders.map((folder) => (
              <div key={folder.id}>
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                  className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-200 dark:border-slate-800"
                >
                  <Folder className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="flex-1 text-left text-sm font-medium text-slate-900 dark:text-white truncate">
                    {folder.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {folder.files?.length || 0} files
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, 'folder', folder.id, folder.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </button>
              </div>
            ))}

            {/* Files - Indented */}
            {filteredFiles.map((file) => {
              const { icon: IconComponent } = getFileIcon(file.fileType);
              return (
                <div
                  key={file.id}
                  onDoubleClick={() => handleFileDoubleClick(file.id)}
                  onContextMenu={(e) =>
                    handleContextMenu(e, 'file', file.id, file.originalName)
                  }
                  className="group flex items-center gap-3 px-4 py-3 pl-12 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-200 dark:border-slate-800 last:border-b-0"
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                    file.fileType === 'pdf' ? 'text-red-500' :
                    ['doc', 'docx'].includes(file.fileType) ? 'text-blue-500' :
                    ['ppt', 'pptx'].includes(file.fileType) ? 'text-orange-500' :
                    'text-slate-400'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* File Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white truncate">
                      {file.originalName}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="uppercase font-medium">{file.fileType}</span>
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span className="hidden sm:inline">{formatDate(file.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, 'file', file.id, file.originalName);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex-shrink-0"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {searchQuery ? 'No results found' : 'No files yet'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
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
            className="fixed bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleRename}
              className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}

        {/* Rename Modal */}
        {showRenameModal && selectedItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Rename {selectedItem.type === 'folder' ? 'Folder' : 'File'}
              </h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRenameModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
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
                  className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {renameMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
