import { useEffect, useRef, useState, useMemo, DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  UploadCloud,
  Youtube,
  File as FileIcon,
  Check,
  AlertCircle,
  FileText,
  Sparkles,
  Mic,
  Pause,
  Play,
  Square,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingProgress from './ui/LoadingProgress';
import SuccessAnimation from './ui/SuccessAnimation';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: (files: FileList) => void;
  onUploadYouTube: (url: string) => void;
  isUploading?: boolean;
  currentFolderId?: string | null;
  requireContentAgreement?: boolean;
  uploadErrorMessage?: string | null;
}

type TabType = 'files' | 'youtube' | 'text' | 'record';
type UploadStage = 'idle' | 'uploading' | 'processing' | 'success';
type UploadContext = 'files' | 'text' | 'record';
type RecordingStatus = 'idle' | 'recording' | 'paused';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.txt';
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
];

const TAB_CONFIG: Array<{ id: TabType; label: string; icon: typeof UploadCloud }> = [
  { id: 'files', label: 'Upload Files', icon: UploadCloud },
  { id: 'youtube', label: 'YouTube Link', icon: Youtube },
  { id: 'text', label: 'Paste Text', icon: FileText },
  { id: 'record', label: 'Record Lecture', icon: Mic },
];

export default function UploadModal({
  isOpen,
  onClose,
  onUploadFiles,
  onUploadYouTube,
  isUploading = false,
  currentFolderId,
  requireContentAgreement = false,
  uploadErrorMessage,
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadContext, setUploadContext] = useState<UploadContext>('files');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasObservedUpload, setHasObservedUpload] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  const clearTransitionTimers = () => {
    if (stageTimerRef.current) {
      window.clearTimeout(stageTimerRef.current);
      stageTimerRef.current = null;
    }
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  };

  const resetFormState = () => {
    setActiveTab('files');
    setYoutubeUrl('');
    setSelectedFiles([]);
    setTextTitle('');
    setTextContent('');
    setHasAgreed(false);
    setIsDragging(false);
    setRecordingStatus('idle');
    setRecordingSeconds(0);
  };

  const resetUploadState = () => {
    clearTransitionTimers();
    setUploadStage('idle');
    setUploadContext('files');
    setHasSubmitted(false);
    setHasObservedUpload(false);
  };

  const handleClose = () => {
    if (isUploading || uploadStage === 'uploading' || uploadStage === 'processing') {
      return;
    }
    resetUploadState();
    resetFormState();
    onClose();
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]{11}([?&][\w%=&.-]*)?$/;
    return youtubeRegex.test(url);
  };

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
      setSelectedFiles((prev) => {
        const merged = [...prev];
        validFiles.forEach((candidate) => {
          const exists = merged.some(
            (existing) =>
              existing.name === candidate.name &&
              existing.size === candidate.size &&
              existing.lastModified === candidate.lastModified
          );
          if (!exists) {
            merged.push(candidate);
          }
        });
        return merged;
      });
    }
  };

  const beginTrackedUpload = (context: UploadContext, files: FileList) => {
    setUploadContext(context);
    setUploadStage('uploading');
    setHasSubmitted(true);
    setHasObservedUpload(false);
    onUploadFiles(files);
  };

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

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitFiles = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    if (requireContentAgreement && !hasAgreed) {
      toast.error('Please confirm the content agreement to continue');
      return;
    }

    const dataTransfer = new DataTransfer();
    selectedFiles.forEach((file) => dataTransfer.items.add(file));
    beginTrackedUpload('files', dataTransfer.files);
  };

  const handleSubmitText = () => {
    if (!textTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!textContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (requireContentAgreement && !hasAgreed) {
      toast.error('Please confirm the content agreement to continue');
      return;
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const file = new (File as any)([blob], `${textTitle}.txt`, { type: 'text/plain' }) as File;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    beginTrackedUpload('text', dataTransfer.files);
  };

  const handleSubmitYouTube = () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    if (requireContentAgreement && !hasAgreed) {
      toast.error('Please confirm the content agreement to continue');
      return;
    }

    onUploadYouTube(youtubeUrl);
    handleClose();
  };

  const handleStartRecording = () => {
    if (requireContentAgreement && !hasAgreed) {
      toast.error('Please confirm the content agreement to continue');
      return;
    }

    setRecordingSeconds(0);
    setRecordingStatus('recording');
  };

  const handleTogglePauseRecording = () => {
    setRecordingStatus((prev) => (prev === 'recording' ? 'paused' : 'recording'));
  };

  const handleStopAndProcessRecording = () => {
    if (recordingStatus === 'idle') return;

    clearTransitionTimers();
    setRecordingStatus('idle');
    setUploadContext('record');
    setUploadStage('processing');
    setHasSubmitted(false);
    setHasObservedUpload(false);

    stageTimerRef.current = window.setTimeout(() => {
      setUploadStage('success');
    }, 1850);

    successTimerRef.current = window.setTimeout(() => {
      resetUploadState();
      resetFormState();
      onClose();
    }, 3100);
  };

  const formatRecordingTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (!isOpen) {
      resetUploadState();
      resetFormState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (recordingStatus !== 'recording') return;

    const intervalId = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [recordingStatus]);

  useEffect(() => {
    if (activeTab !== 'record' && recordingStatus !== 'idle') {
      setRecordingStatus('idle');
      setRecordingSeconds(0);
    }
  }, [activeTab, recordingStatus]);

  useEffect(() => {
    if (!isOpen || !hasSubmitted) return;

    if (isUploading) {
      setHasObservedUpload(true);
      setUploadStage((prev) => (prev === 'processing' ? prev : 'uploading'));
      if (stageTimerRef.current) {
        window.clearTimeout(stageTimerRef.current);
      }
      stageTimerRef.current = window.setTimeout(() => {
        setUploadStage('processing');
      }, 900);
      return;
    }

    if (hasObservedUpload) {
      if (uploadErrorMessage) {
        resetUploadState();
        return;
      }

      setUploadStage('success');
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = window.setTimeout(() => {
        resetUploadState();
        resetFormState();
        onClose();
      }, 1250);
    }
  }, [isOpen, hasSubmitted, hasObservedUpload, isUploading, uploadErrorMessage, onClose]);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
    };
  }, []);

  const isLocked = isUploading || uploadStage === 'uploading' || uploadStage === 'processing';

  const isSubmitDisabled =
    isLocked ||
    (requireContentAgreement && !hasAgreed) ||
    (activeTab === 'files'
      ? selectedFiles.length === 0
      : activeTab === 'youtube'
      ? !isValidYouTubeUrl(youtubeUrl)
      : activeTab === 'record'
      ? true
      : !textTitle.trim() || !textContent.trim());

  const isRecordStartDisabled = isLocked || (requireContentAgreement && !hasAgreed);

  const stageMessage = useMemo(() => {
    if (uploadStage === 'uploading') {
      return uploadContext === 'text'
        ? 'Uploading generated text file...'
        : `Uploading ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}...`;
    }

    if (uploadStage === 'processing') {
      if (uploadContext === 'record') {
        return 'Transcribing your recording and generating notes, quizzes, and flashcards...';
      }

      return uploadContext === 'text'
        ? 'Converting text into notes, quizzes, and flashcards...'
        : 'Extracting key ideas and preparing your study set...';
    }

    return '';
  }, [uploadStage, uploadContext, selectedFiles.length]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-4xl h-[min(90vh,820px)] rounded-3xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-black/90 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_40%)]" />

          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-start justify-between px-6 sm:px-8 pt-6 pb-5 border-b border-slate-200/80 dark:border-white/10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Premium Upload Hub
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Create New Study Set</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
                  Upload files, process a YouTube video, convert text, or live-record audio into structured study material.
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isLocked}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close upload modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 sm:px-8 pt-5">
              <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10">
                {TAB_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      disabled={isLocked}
                      className="relative px-3 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="upload-tab-active-pill"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 shadow-[0_8px_20px_rgba(79,70,229,0.35)]"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span
                        className={`relative z-10 inline-flex items-center justify-center gap-2 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6 pt-5">
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === 'files' ? (
                  <motion.div
                    key="tab-files"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <motion.div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ scale: 1.005 }}
                      animate={
                        isDragging
                          ? {
                              scale: 1.02,
                              boxShadow:
                                '0 0 0 2px rgba(139,92,246,0.45), 0 20px 48px rgba(139,92,246,0.26)',
                            }
                          : {
                              scale: 1,
                              boxShadow: '0 10px 34px rgba(15,23,42,0.16)',
                            }
                      }
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`relative rounded-3xl border-2 border-dashed p-10 sm:p-12 text-center cursor-pointer bg-gradient-to-br from-slate-100 to-white dark:from-zinc-950 dark:to-black ${
                        isDragging
                          ? 'border-violet-500'
                          : 'border-slate-300 dark:border-white/20 hover:border-violet-400 dark:hover:border-violet-400'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_FILE_TYPES}
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                        disabled={isLocked}
                      />

                      <div className="mx-auto w-fit mb-4">
                        <motion.div
                          animate={
                            isDragging
                              ? { scale: [1, 1.12, 1], y: [0, -3, 0] }
                              : { scale: 1, y: 0 }
                          }
                          transition={{ duration: 1, repeat: isDragging ? Infinity : 0 }}
                          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center shadow-lg"
                        >
                          <UploadCloud className="w-8 h-8" />
                        </motion.div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {isDragging ? 'Drop files to begin' : 'Drag files to build a study set'}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-4">
                        Upload lecture slides, notes, assignments, and text documents in one place.
                      </p>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/80 dark:bg-white/10 border border-slate-300/80 dark:border-white/20 text-xs font-medium text-slate-700 dark:text-slate-200">
                        <FileIcon className="w-4 h-4" />
                        PDF, DOCX, PPTX, TXT • Max 50MB each
                      </div>

                      <div className="mt-4 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('record');
                          }}
                          disabled={isLocked}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white text-sm font-semibold shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Mic className="w-4 h-4" />
                          Record New Lecture
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                        {currentFolderId
                          ? 'Files will be added to your current folder.'
                          : 'Files will be added to your root study library.'}
                      </p>
                    </motion.div>

                    {selectedFiles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/60 p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Selected files ({selectedFiles.length})
                          </p>
                        </div>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          <AnimatePresence initial={false}>
                            {selectedFiles.map((file, index) => (
                              <motion.div
                                key={`${file.name}-${file.size}-${file.lastModified}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                              >
                                <div className="min-w-0 flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                    <FileIcon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile(index);
                                  }}
                                  className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                  disabled={isLocked}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : activeTab === 'youtube' ? (
                  <motion.div
                    key="tab-youtube"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/60 p-5">
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        YouTube URL
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center pointer-events-none">
                          <Youtube className="w-5 h-5 text-red-500" />
                        </div>
                        <input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className={`w-full pl-14 pr-12 py-4 rounded-xl border-2 bg-white dark:bg-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                            youtubeUrl && isValidYouTubeUrl(youtubeUrl)
                              ? 'border-emerald-500 focus:ring-emerald-500/30'
                              : youtubeUrl && !isValidYouTubeUrl(youtubeUrl)
                              ? 'border-red-500 focus:ring-red-500/30'
                              : 'border-slate-200 dark:border-white/15 focus:ring-violet-500/30 focus:border-violet-500'
                          }`}
                          disabled={isLocked}
                        />
                        {youtubeUrl && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isValidYouTubeUrl(youtubeUrl) ? (
                              <Check className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Supported formats:</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all">
                          youtube.com/watch?v=..., youtu.be/..., /shorts/... and /embed/...
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'text' ? (
                  <motion.div
                    key="tab-text"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/60 p-5 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Title</label>
                        <input
                          type="text"
                          value={textTitle}
                          onChange={(e) => setTextTitle(e.target.value)}
                          placeholder="e.g., Biology Chapter 4 Notes"
                          maxLength={100}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/15 bg-white dark:bg-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                          disabled={isLocked}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{textTitle.length}/100 characters</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Content</label>
                        <textarea
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="Paste your notes, transcript, article excerpt, or summary text..."
                          rows={11}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/15 bg-white dark:bg-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none"
                          disabled={isLocked}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          {textContent.length.toLocaleString()} characters
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-record"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white/90 to-slate-100 dark:from-black/80 dark:to-zinc-950 p-6 sm:p-8">
                      <div className="text-center max-w-2xl mx-auto">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Record Live Audio</h3>
                        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                          Capture a lecture, explanation, or brainstorming session and transform it into study-ready content.
                        </p>
                      </div>

                      <AnimatePresence mode="wait" initial={false}>
                        {recordingStatus === 'idle' ? (
                          <motion.div
                            key="record-idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="flex flex-col items-center justify-center py-10 sm:py-12"
                          >
                            <motion.button
                              type="button"
                              onClick={handleStartRecording}
                              disabled={isRecordStartDisabled}
                              whileTap={{ scale: 0.98 }}
                              animate={{
                                scale: [1, 1.02, 1],
                                boxShadow: [
                                  '0 10px 30px rgba(239,68,68,0.30)',
                                  '0 18px 42px rgba(239,68,68,0.38)',
                                  '0 10px 30px rgba(239,68,68,0.30)',
                                ],
                              }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                                <motion.span
                                  className="absolute inset-0 rounded-full border border-white/40"
                                  animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                                />
                                <Mic className="relative w-5 h-5" />
                              </span>
                              Start Recording
                            </motion.button>
                            <p className="mt-5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center">
                              Your recording will be processed into notes, quiz questions, and key takeaways.
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="record-active"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="mt-8 space-y-5"
                          >
                            <div className="rounded-2xl border border-red-300/50 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">
                                  {recordingStatus === 'paused' ? 'Recording paused' : 'Recording live'}
                                </p>
                                <p className="mt-1 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tabular-nums">
                                  {formatRecordingTime(recordingSeconds)}
                                </p>
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/90 dark:bg-black/40 border border-red-200/80 dark:border-red-500/30 text-xs sm:text-sm font-medium text-red-600 dark:text-red-200">
                                <motion.span
                                  className="w-2.5 h-2.5 rounded-full bg-red-500"
                                  animate={
                                    recordingStatus === 'recording'
                                      ? { opacity: [1, 0.35, 1], scale: [1, 1.2, 1] }
                                      : { opacity: 0.45, scale: 1 }
                                  }
                                  transition={{ duration: 1.1, repeat: Infinity }}
                                />
                                {recordingStatus === 'paused' ? 'Paused' : 'Capturing audio'}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/55 p-5 sm:p-6">
                              <div className="flex items-end justify-center gap-1.5 sm:gap-2 h-20 sm:h-24">
                                {Array.from({ length: 18 }).map((_, index) => (
                                  <motion.div
                                    key={`wave-${index}`}
                                    className="w-1.5 sm:w-2 rounded-full bg-gradient-to-t from-blue-500 to-violet-500"
                                    animate={
                                      recordingStatus === 'recording'
                                        ? { height: [16, 44 - (index % 5) * 4, 20 + (index % 4) * 4], opacity: [0.45, 1, 0.5] }
                                        : { height: 14, opacity: 0.3 }
                                    }
                                    transition={{
                                      duration: 1.05,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                      delay: index * 0.05,
                                    }}
                                  />
                                ))}
                              </div>
                              <p className="mt-4 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                {recordingStatus === 'paused'
                                  ? 'Recording is paused. Resume to continue capturing audio.'
                                  : 'Listening in real time and preparing transcript-ready audio.'}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                              <button
                                type="button"
                                onClick={handleTogglePauseRecording}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                              >
                                {recordingStatus === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                {recordingStatus === 'paused' ? 'Resume' : 'Pause'}
                              </button>
                              <button
                                type="button"
                                onClick={handleStopAndProcessRecording}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all"
                              >
                                <Square className="w-4 h-4" />
                                Stop &amp; Process
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {requireContentAgreement && (
              <div className="px-6 sm:px-8 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-zinc-900/60">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                    disabled={isLocked}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    I confirm this content is mine to upload and does not violate academic integrity or copyright policy.
                  </span>
                </label>
              </div>
            )}

            <div className="px-6 sm:px-8 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 bg-white/70 dark:bg-black/70">
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {activeTab === 'record'
                  ? 'Tip: Pause recording when you need a break, then resume before processing.'
                  : 'Tip: You can drag files directly into this modal for faster uploads.'}
              </p>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={handleClose}
                  disabled={isLocked}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {activeTab !== 'record' && (
                  <button
                    onClick={
                      activeTab === 'files'
                        ? handleSubmitFiles
                        : activeTab === 'youtube'
                        ? handleSubmitYouTube
                        : handleSubmitText
                    }
                    disabled={isSubmitDisabled}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {activeTab === 'youtube'
                      ? 'Process Video'
                      : activeTab === 'text'
                      ? 'Create from Text'
                      : 'Upload and Build'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {uploadStage !== 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-40 bg-white/75 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
              >
                <AnimatePresence mode="wait">
                  {uploadStage === 'success' ? (
                    <motion.div
                      key="upload-success"
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="w-full max-w-md rounded-3xl border border-emerald-400/30 bg-white/95 dark:bg-black/90 p-8 text-center"
                    >
                      <div className="relative h-28 flex items-center justify-center">
                        <SuccessAnimation
                          show={uploadStage === 'success'}
                          inline
                          variant="check"
                          message="Study set created"
                        />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                        Your material is ready. Opening your refreshed workspace...
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload-loading"
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-black/90 p-6"
                    >
                      <LoadingProgress
                        message={uploadStage === 'uploading' ? 'Uploading' : 'Processing'}
                        stage={stageMessage}
                        variant="upload"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
