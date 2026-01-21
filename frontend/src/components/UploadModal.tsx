/**
 * Multi-Source Upload Modal
 * Supports file uploads and YouTube links with glassmorphism styling
 */

import { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Youtube, File, Check, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingProgress from './ui/LoadingProgress';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: (files: FileList) => void;
  onUploadYouTube: (url: string) => void;
  isUploading?: boolean;
  currentFolderId?: string | null;
}

type TabType = 'files' | 'youtube' | 'text';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.txt';
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
];

export default function UploadModal({
  isOpen,
  onClose,
  onUploadFiles,
  onUploadYouTube,
  isUploading = false,
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  const handleClose = () => {
    setActiveTab('files');
    setYoutubeUrl('');
    setSelectedFiles([]);
    setTextTitle('');
    setTextContent('');
    setIsDragging(false);
    onClose();
  };

  // Validate YouTube URL
  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&[\w=]*)?$/;
    return youtubeRegex.test(url);
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (ACCEPTED_MIME_TYPES.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Unsupported file types: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  // Handle drag & drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit files
  const handleSubmitFiles = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    const dataTransfer = new DataTransfer();
    selectedFiles.forEach((file) => dataTransfer.items.add(file));
    onUploadFiles(dataTransfer.files);
    handleClose();
  };

  // Submit YouTube URL
  const handleSubmitYouTube = () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    onUploadYouTube(youtubeUrl);
    handleClose();
  };

  // Submit pasted text
  const handleSubmitText = () => {
    if (!textTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!textContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    // Create a File object from the text content
    const blob = new Blob([textContent], { type: 'text/plain' });
    const file = new (File as any)([blob], `${textTitle}.txt`, { type: 'text/plain' }) as File;
    
    // Use DataTransfer to create a FileList
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    onUploadFiles(dataTransfer.files);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-950 backdrop-blur-md border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden will-change-transform"
        >
          {/* Upload Loading Overlay */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-50 bg-white/90 dark:bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center"
              >
                <LoadingProgress
                  message="Uploading"
                  stage={
                    activeTab === 'youtube'
                      ? 'Processing YouTube link...'
                      : activeTab === 'text'
                      ? 'Processing text content...'
                      : `Uploading ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}...`
                  }
                  variant="upload"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Material</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add files or YouTube videos to your library</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-150 active:scale-95 will-change-transform"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/50">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-150 relative active:scale-95 ${
                activeTab === 'files'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </div>
              {activeTab === 'files' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-150 relative active:scale-95 ${
                activeTab === 'youtube'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Youtube className="w-4 h-4" />
                <span>YouTube Link</span>
              </div>
              {activeTab === 'youtube' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-150 relative active:scale-95 ${
                activeTab === 'text'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Paste Text</span>
              </div>
              {activeTab === 'text' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500"
                />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
            {activeTab === 'files' ? (
              <div className="space-y-4">
                {/* Drag & Drop Zone - Premium Design */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                      : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {isDragging ? 'Drop files here' : 'Drag and drop your files here'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        or click to browse
                      </p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                      <File className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        PDF, DOCX, PPTX, TXT • Max 50MB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Selected Files ({selectedFiles.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                              <File className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(index);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'youtube' ? (
              <div className="space-y-5">
                {/* YouTube URL Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    YouTube Video URL
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-red-500" />
                    </div>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={`w-full pl-16 pr-12 py-4 bg-white dark:bg-slate-800 border-2 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        youtubeUrl && isValidYouTubeUrl(youtubeUrl)
                          ? 'border-green-500 dark:border-green-500 focus:ring-green-500/30'
                          : youtubeUrl && !isValidYouTubeUrl(youtubeUrl)
                          ? 'border-red-500 dark:border-red-500 focus:ring-red-500/30'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500'
                      }`}
                    />
                    {youtubeUrl && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isValidYouTubeUrl(youtubeUrl) ? (
                          <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {youtubeUrl && !isValidYouTubeUrl(youtubeUrl) && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Please enter a valid YouTube URL (youtube.com or youtu.be)
                    </p>
                  )}
                </div>

                {/* Example URLs */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">Example formats:</p>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400">•</span>
                      <span>https://www.youtube.com/watch?v=dQw4w9WgXcQ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400">•</span>
                      <span>https://youtu.be/dQw4w9WgXcQ</span>
                    </li>
                  </ul>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    The video will be processed and added to your library
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    Title
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      placeholder="Enter a title for your text..."
                      className="w-full px-4 py-4 bg-white/5 dark:bg-white/5 backdrop-blur-sm border-2 border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      maxLength={100}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {textTitle.length}/100 characters
                  </p>
                </div>

                {/* Content Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    Content
                  </label>
                  <div className="relative">
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste or type your content here...&#10;&#10;This could be lecture notes, study materials, or any text you want to process."
                      rows={12}
                      className="w-full px-4 py-4 bg-white/5 dark:bg-white/5 backdrop-blur-sm border-2 border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {textContent.length.toLocaleString()} characters
                  </p>
                </div>

                {/* Info Banner */}
                <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4">
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                    Your text will be saved and processed like a regular file
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 disabled:opacity-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={
                activeTab === 'files'
                  ? handleSubmitFiles
                  : activeTab === 'youtube'
                  ? handleSubmitYouTube
                  : handleSubmitText
              }
              disabled={
                isUploading ||
                (activeTab === 'files'
                  ? selectedFiles.length === 0
                  : activeTab === 'youtube'
                  ? !isValidYouTubeUrl(youtubeUrl)
                  : !textTitle.trim() || !textContent.trim())
              }
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 will-change-transform"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
