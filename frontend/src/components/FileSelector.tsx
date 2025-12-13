/**
 * FileSelector Component
 * Multi-select file picker with search and clean visual design
 */

import { useState, useMemo } from 'react';
import { Search, Check, FileText, File, Image, Video, Music, Archive } from 'lucide-react';
import { UploadedFile } from '../types/global';

interface FileSelectorProps {
  files: UploadedFile[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  multiSelect?: boolean;
  className?: string;
}

export default function FileSelector({
  files,
  selectedIds,
  onToggle,
  multiSelect = true,
  className = '',
}: FileSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    
    const query = searchQuery.toLowerCase();
    return files.filter(file =>
      file.originalName.toLowerCase().includes(query) ||
      file.fileName.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  // Get file type icon with appropriate color
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-green-500" />;
    if (fileType.startsWith('video/')) return <Video className="h-5 w-5 text-blue-500" />;
    if (fileType.startsWith('audio/')) return <Music className="h-5 w-5 text-purple-500" />;
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('document') || fileType.includes('word')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (fileType === 'application/zip' || fileType.includes('archive')) return <Archive className="h-5 w-5 text-yellow-500" />;
    if (fileType === 'text/plain') return <File className="h-5 w-5 text-gray-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // Format upload date
  const formatUploadDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Uploaded today';
    if (diffInDays === 1) return 'Uploaded yesterday';
    if (diffInDays < 7) return `Uploaded ${diffInDays} days ago`;
    if (diffInDays < 30) return `Uploaded ${Math.floor(diffInDays / 7)} weeks ago`;
    
    return `Uploaded ${date.toLocaleDateString()}`;
  };

  // Handle file selection
  const handleToggle = (fileId: string) => {
    if (!multiSelect) {
      // Single select mode - clear others and select this one
      onToggle(fileId);
    } else {
      // Multi select mode
      onToggle(fileId);
    }
  };

  const isSelected = (fileId: string) => selectedIds.includes(fileId);

  return (
    <div className={`border border-slate-200 dark:border-slate-800 rounded-xl ${className}`}>
      {/* Search Bar - Sticky at top */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 rounded-t-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* File List */}
      <div className="h-96 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
            <File className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">
              {searchQuery.trim() ? 'No files match your search' : 'No files uploaded yet'}
            </p>
            {searchQuery.trim() && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => handleToggle(file.id)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                  hover:bg-slate-50 dark:hover:bg-slate-800/50
                  ${isSelected(file.id) 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-cyan-500' 
                    : ''
                  }
                `}
              >
                {/* Custom Checkbox */}
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected(file.id)
                    ? 'bg-cyan-500 border-cyan-500'
                    : 'border-slate-300 dark:border-slate-600 hover:border-cyan-400'
                  }
                `}>
                  {isSelected(file.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file.fileType)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {formatUploadDate(file.createdAt)}
                  </p>
                </div>

                {/* File Size */}
                <div className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  {file.fileSize ? `${(file.fileSize / (1024 * 1024)).toFixed(1)} MB` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}