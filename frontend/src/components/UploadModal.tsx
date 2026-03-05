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
  Link,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingProgress from './ui/LoadingProgress';
import SuccessAnimation from './ui/SuccessAnimation';
import { createUploadFileId, type UploadProgressSnapshot } from '@/lib/uploadProgress';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: (files: FileList) => void;
  onUploadRecording?: (payload: RecordingUploadPayload) => void | Promise<void>;
  onUploadYouTube: (url: string) => void;
  onUploadLink?: (url: string) => void;
  isUploading?: boolean;
  uploadProgress?: UploadProgressSnapshot | null;
  currentFolderId?: string | null;
  requireContentAgreement?: boolean;
  uploadErrorMessage?: string | null;
}

export interface RecordingTimelineEntry {
  timestamp: number;
  text: string;
}

export interface RecordingUploadPayload {
  audioFile: File;
  transcript: string;
  timeline: RecordingTimelineEntry[];
  capturedAt: string;
  durationSeconds: number;
}

type TabType = 'files' | 'youtube' | 'link' | 'text' | 'record';
type UploadStage = 'idle' | 'uploading' | 'processing' | 'success';
type UploadContext = 'files' | 'text' | 'record';
type RecordingStatus = 'idle' | 'recording' | 'paused';

const ACCEPTED_FILE_TYPES =
  '.pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.txt,.webm,.mp3,.wav,.m4a,.mp4,.ogg';
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/ogg',
  'text/plain',
  'application/octet-stream',
];

const ACCEPTED_FILE_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.doc',
  '.txt',
  '.ppt',
  '.pptx',
  '.pps',
  '.ppsx',
  '.webm',
  '.mp4',
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
]);

const TAB_CONFIG: Array<{ id: TabType; label: string; icon: typeof UploadCloud }> = [
  { id: 'files', label: 'Upload Files', icon: UploadCloud },
  { id: 'youtube', label: 'YouTube Link', icon: Youtube },
  { id: 'link', label: 'Web Link', icon: Link },
  { id: 'text', label: 'Paste Text', icon: FileText },
  { id: 'record', label: 'Record Lecture', icon: Mic },
];

export default function UploadModal({
  isOpen,
  onClose,
  onUploadFiles,
  onUploadRecording,
  onUploadYouTube,
  onUploadLink,
  isUploading = false,
  uploadProgress,
  currentFolderId,
  requireContentAgreement = false,
  uploadErrorMessage,
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recordingInterimTranscript, setRecordingInterimTranscript] = useState('');
  const [recordingErrorMessage, setRecordingErrorMessage] = useState<string | null>(null);

  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadContext, setUploadContext] = useState<UploadContext>('files');
  const [uploadFilesInFlight, setUploadFilesInFlight] = useState<
    Array<{ id: string; name: string; size: number }>
  >([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasObservedUpload, setHasObservedUpload] = useState(false);

  const availableTabs = useMemo(
    () => (onUploadRecording ? TAB_CONFIG : TAB_CONFIG.filter((tab) => tab.id !== 'record')),
    [onUploadRecording]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const transcriptTimelineRef = useRef<Array<{ timestamp: number; text: string }>>([]);
  const transcriptSegmentStartTimesRef = useRef<Map<number, number>>(new Map());
  const recordingStartedAtMsRef = useRef<number | null>(null);
  const recordingPausedAtMsRef = useRef<number | null>(null);
  const recordingAccumulatedPausedMsRef = useRef(0);
  const recordingSecondsRef = useRef(0);
  const finalTranscriptRef = useRef('');
  const shouldRestartRecognitionRef = useRef(false);
  const recordingStatusRef = useRef<RecordingStatus>('idle');

  const estimateTranscriptLeadSeconds = (segment: string) => {
    const words = String(segment || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return Math.min(4, Math.max(1, Math.round(words / 3)));
  };

  const getRecordingClockMs = () =>
    (typeof performance !== 'undefined' ? performance.now() : Date.now());

  const getRecordingElapsedSeconds = () => {
    const startedAtMs = recordingStartedAtMsRef.current;
    if (typeof startedAtMs !== 'number') {
      return recordingSecondsRef.current;
    }

    const nowMs = getRecordingClockMs();
    const pausedAtMs = recordingPausedAtMsRef.current;
    const currentPausedDurationMs =
      typeof pausedAtMs === 'number' ? Math.max(0, nowMs - pausedAtMs) : 0;

    const activeDurationMs =
      nowMs - startedAtMs - recordingAccumulatedPausedMsRef.current - currentPausedDurationMs;

    return Math.max(0, activeDurationMs / 1000);
  };

  const splitTranscriptSentences = (source: string) => {
    const normalizedSource = String(source || '').replace(/\s+/g, ' ').trim();
    if (!normalizedSource) {
      return [] as string[];
    }

    const sentenceChunks = normalizedSource
      .split(/(?<=[.!?])\s+/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .slice(0, 80);

    if (sentenceChunks.length > 1) {
      return sentenceChunks;
    }

    const words = normalizedSource.split(/\s+/).filter(Boolean);
    if (words.length <= 14) {
      return sentenceChunks;
    }

    const fallbackChunks: string[] = [];
    for (let index = 0; index < words.length; index += 12) {
      fallbackChunks.push(words.slice(index, index + 12).join(' ').trim());
    }

    return fallbackChunks.filter(Boolean).slice(0, 80);
  };

  const buildTimelineFromTranscript = (transcript: string, durationSeconds: number) => {
    const sentenceChunks = splitTranscriptSentences(transcript);
    if (!sentenceChunks.length) {
      return [] as Array<{ timestamp: number; text: string }>;
    }

    if (sentenceChunks.length === 1) {
      return [{ timestamp: 0, text: sentenceChunks[0] }];
    }

    const safeDuration =
      durationSeconds > 0 ? durationSeconds : Math.max(sentenceChunks.length * 4, sentenceChunks.length);
    const maxSecond = Math.max(0, safeDuration - 1);

    return sentenceChunks.map((text, index) => ({
      timestamp: Math.round((index / Math.max(1, sentenceChunks.length - 1)) * maxSecond),
      text,
    }));
  };

  const normalizeRecordingTimeline = (
    rawEntries: Array<{ timestamp: number; text: string }>,
    transcript: string,
    durationSeconds: number
  ) => {
    const sanitizedEntries = rawEntries
      .map((entry) => ({
        timestamp: Number(entry.timestamp) || 0,
        text: String(entry.text || '').trim(),
      }))
      .filter((entry) => entry.text.length > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .filter((entry, index, array) => {
        if (index === 0) return true;
        const previous = array[index - 1];
        return previous.text !== entry.text || previous.timestamp !== entry.timestamp;
      });

    const transcriptFallbackTimeline = buildTimelineFromTranscript(transcript, durationSeconds);

    if (!sanitizedEntries.length) {
      return transcriptFallbackTimeline;
    }

    const normalizedTranscriptLength = String(transcript || '').replace(/\s+/g, ' ').trim().length;
    const cueCoverageRatio =
      normalizedTranscriptLength > 0
        ? sanitizedEntries.map((entry) => entry.text).join(' ').length / normalizedTranscriptLength
        : 1;

    const uniqueSecondCount = new Set(sanitizedEntries.map((entry) => Math.floor(entry.timestamp))).size;
    const hasHeavyOverlap =
      sanitizedEntries.length > 1 &&
      uniqueSecondCount <= Math.max(1, Math.ceil(sanitizedEntries.length * 0.6));

    const shouldUseFallbackTimeline =
      transcriptFallbackTimeline.length > 1 && (hasHeavyOverlap || cueCoverageRatio < 0.55);

    const workingTimeline = shouldUseFallbackTimeline ? transcriptFallbackTimeline : sanitizedEntries;

    const roundedTimeline = workingTimeline.map((entry) => ({
      timestamp: Math.max(0, Math.round(entry.timestamp)),
      text: entry.text,
    }));

    if (roundedTimeline.length <= 1) {
      return roundedTimeline;
    }

    const hasOverlappingSeconds = roundedTimeline.some(
      (entry, index) => index > 0 && entry.timestamp <= roundedTimeline[index - 1].timestamp
    );

    if (!hasOverlappingSeconds) {
      return roundedTimeline;
    }

    const maxSecond =
      durationSeconds > 0
        ? Math.max(durationSeconds - 1, roundedTimeline.length - 1)
        : Math.max(roundedTimeline.length * 4, roundedTimeline.length - 1);

    return roundedTimeline.map((entry, index) => ({
      timestamp: Math.round((index / Math.max(1, roundedTimeline.length - 1)) * maxSecond),
      text: entry.text,
    }));
  };

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

  const getSpeechRecognitionConstructor = () => {
    if (typeof window === 'undefined') return null;

    const speechWindow = window as Window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };

    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  };

  const releaseRecordingResources = () => {
    shouldRestartRecognitionRef.current = false;

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore SpeechRecognition stop errors
      }
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore MediaRecorder stop errors
      }
    }
    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      mediaStreamRef.current = null;
    }
  };

  const resetRecordingState = () => {
    setRecordingStatus('idle');
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;
    recordingStartedAtMsRef.current = null;
    recordingPausedAtMsRef.current = null;
    recordingAccumulatedPausedMsRef.current = 0;
    setRecordedTranscript('');
    setRecordingInterimTranscript('');
    setRecordingErrorMessage(null);
    transcriptTimelineRef.current = [];
    transcriptSegmentStartTimesRef.current.clear();
    finalTranscriptRef.current = '';
    recordedChunksRef.current = [];
  };

  const isValidPublicUrl = (url: string): boolean => {
    if (!url.trim()) return false;

    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionConstructor) {
      setRecordingErrorMessage('Live transcription is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore stop race conditions
      }
      speechRecognitionRef.current = null;
    }

    try {
      transcriptSegmentStartTimesRef.current.clear();
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let latestInterimTranscript = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const recognitionResult = event.results[index];
          const transcriptSegment = recognitionResult?.[0]?.transcript?.trim() || '';
          if (!transcriptSegment) continue;

          const observedSeconds = getRecordingElapsedSeconds();

          const existingStartTimestamp = transcriptSegmentStartTimesRef.current.get(index);
          if (typeof existingStartTimestamp !== 'number') {
            transcriptSegmentStartTimesRef.current.set(index, observedSeconds);
          }

          const segmentStartTimestamp =
            transcriptSegmentStartTimesRef.current.get(index) ?? observedSeconds;

          if (recognitionResult.isFinal) {
            const estimatedLeadSeconds = estimateTranscriptLeadSeconds(transcriptSegment);
            const alignedStartTimestamp =
              typeof existingStartTimestamp === 'number'
                ? Math.max(0, segmentStartTimestamp)
                : Math.max(0, observedSeconds - estimatedLeadSeconds);

            finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcriptSegment}`.trim();
            transcriptTimelineRef.current.push({
              timestamp: alignedStartTimestamp,
              text: transcriptSegment,
            });
            transcriptSegmentStartTimesRef.current.delete(index);
          } else {
            latestInterimTranscript = `${latestInterimTranscript} ${transcriptSegment}`.trim();
          }
        }

        setRecordedTranscript(finalTranscriptRef.current);
        setRecordingInterimTranscript(latestInterimTranscript);
      };

      recognition.onerror = (event: any) => {
        const errorCode = String(event?.error || '');
        if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
          shouldRestartRecognitionRef.current = false;
          setRecordingErrorMessage('Speech recognition permission was denied.');
          return;
        }

        if (errorCode && errorCode !== 'aborted' && errorCode !== 'no-speech') {
          setRecordingErrorMessage('Live transcription encountered an issue. Continue speaking or try again.');
        }
      };

      recognition.onend = () => {
        if (shouldRestartRecognitionRef.current && recordingStatusRef.current === 'recording') {
          try {
            recognition.start();
          } catch {
            // Ignore restart race conditions
          }
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setRecordingErrorMessage('Unable to start live transcription in this browser.');
    }
  };

  const resetFormState = () => {
    setActiveTab('files');
    setYoutubeUrl('');
    setLinkUrl('');
    setSelectedFiles([]);
    setTextTitle('');
    setTextContent('');
    setHasAgreed(false);
    setIsDragging(false);
    resetRecordingState();
  };

  const resetUploadState = () => {
    clearTransitionTimers();
    setUploadStage('idle');
    setUploadContext('files');
    setUploadFilesInFlight([]);
    setHasSubmitted(false);
    setHasObservedUpload(false);
  };

  const handleClose = () => {
    if (isUploading || uploadStage === 'uploading' || uploadStage === 'processing') {
      return;
    }
    releaseRecordingResources();
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
      const normalizedMime = (file.type || '').toLowerCase();
      const lowerName = (file.name || '').toLowerCase();
      const lastDot = lowerName.lastIndexOf('.');
      const extension = lastDot >= 0 ? lowerName.slice(lastDot) : '';

      const mimeAccepted = normalizedMime.length > 0 && ACCEPTED_MIME_TYPES.includes(normalizedMime);
      const extensionAccepted = ACCEPTED_FILE_EXTENSIONS.has(extension);

      if (mimeAccepted || extensionAccepted) {
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
    setUploadFilesInFlight(
      Array.from(files).map((file) => ({
        id: createUploadFileId(file),
        name: file.name,
        size: file.size,
      }))
    );
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

  const handleSubmitLink = () => {
    if (!linkUrl.trim()) {
      toast.error('Please enter a public URL');
      return;
    }

    if (!isValidPublicUrl(linkUrl)) {
      toast.error('Please enter a valid public http(s) URL');
      return;
    }

    if (requireContentAgreement && !hasAgreed) {
      toast.error('Please confirm the content agreement to continue');
      return;
    }

    if (!onUploadLink) {
      toast.error('Web link import is not available in this view yet.');
      return;
    }

    onUploadLink(linkUrl.trim());
    handleClose();
  };

  const handleStartRecording = async () => {
    if (requireContentAgreement && !hasAgreed) {
      toast.error('Please confirm the content agreement to continue');
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      const message = 'Audio recording is not supported on this browser/device.';
      setRecordingErrorMessage(message);
      toast.error(message);
      return;
    }

    releaseRecordingResources();
    resetRecordingState();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
      ];
      const supportedMimeType = preferredMimeTypes.find((mimeType) =>
        MediaRecorder.isTypeSupported(mimeType)
      );

      const mediaRecorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(750);
      mediaRecorderRef.current = mediaRecorder;
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingStartedAtMsRef.current = getRecordingClockMs();
      recordingPausedAtMsRef.current = null;
      recordingAccumulatedPausedMsRef.current = 0;
      setRecordingStatus('recording');
      shouldRestartRecognitionRef.current = true;
      setRecordingErrorMessage(null);
      startSpeechRecognition();
    } catch (error: any) {
      releaseRecordingResources();
      resetRecordingState();

      const permissionDenied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      const message = permissionDenied
        ? 'Microphone access was denied. Please allow microphone access and try again.'
        : 'Unable to start recording on this device.';

      setRecordingErrorMessage(message);
      toast.error(message);
    }
  };

  const handleTogglePauseRecording = () => {
    if (recordingStatus === 'recording') {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.pause();
      }

      if (recordingPausedAtMsRef.current === null) {
        recordingPausedAtMsRef.current = getRecordingClockMs();
      }

      shouldRestartRecognitionRef.current = false;
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // Ignore speech stop race conditions
        }
      }

      setRecordingStatus('paused');
      setRecordingInterimTranscript('');
      return;
    }

    if (recordingStatus === 'paused') {
      if (mediaRecorderRef.current?.state === 'paused') {
        mediaRecorderRef.current.resume();
      }

      if (recordingPausedAtMsRef.current !== null) {
        recordingAccumulatedPausedMsRef.current += Math.max(
          0,
          getRecordingClockMs() - recordingPausedAtMsRef.current
        );
        recordingPausedAtMsRef.current = null;
      }

      setRecordingStatus('recording');
      shouldRestartRecognitionRef.current = true;
      startSpeechRecognition();
    }
  };

  const handleStopAndProcessRecording = () => {
    if (recordingStatus === 'idle') return;

    if (requireContentAgreement && !hasAgreed) {
      toast.error('Please confirm the content agreement to continue');
      return;
    }

    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.requestData();
      } catch {
        // Ignore requestData race conditions
      }
    }

    const transcript = `${finalTranscriptRef.current} ${recordingInterimTranscript}`.trim();
    const recordingDurationSeconds = Math.max(
      0,
      Math.ceil(Math.max(recordingSecondsRef.current, getRecordingElapsedSeconds()))
    );

    const interimCueText = String(recordingInterimTranscript || '').trim();
    const rawTimelineEntries = interimCueText
      ? [
          ...transcriptTimelineRef.current,
          {
            timestamp: Math.max(
              0,
              getRecordingElapsedSeconds() - estimateTranscriptLeadSeconds(interimCueText)
            ),
            text: interimCueText,
          },
        ]
      : transcriptTimelineRef.current;

    const timelineEntries = normalizeRecordingTimeline(
      rawTimelineEntries,
      transcript,
      recordingDurationSeconds
    );

    const timelineTranscript = timelineEntries
      .map((entry) => `[${formatRecordingTime(entry.timestamp)}] ${entry.text}`)
      .join('\n');

    const capturedAtIso = new Date().toISOString();

    const audioMimeType = recordedChunksRef.current[0]?.type || 'audio/webm';
    const audioBlob =
      recordedChunksRef.current.length > 0
        ? new Blob(recordedChunksRef.current, { type: audioMimeType })
        : null;

    releaseRecordingResources();
    setRecordingStatus('idle');
    setRecordingInterimTranscript('');
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;

    const hasTranscript = transcript.length > 0;
    const hasAudio = !!audioBlob && audioBlob.size > 0;

    if (!hasTranscript) {
      const message =
        'No speech transcript was captured. Please use Chrome or Edge, speak clearly, and try again.';
      setRecordingErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!hasAudio || !audioBlob) {
      const message =
        'No audio was captured. Please check microphone permissions and try recording again.';
      setRecordingErrorMessage(message);
      toast.error(message);
      return;
    }

    const recordingId = Date.now();

    const extension = audioMimeType.includes('mpeg')
      ? 'mp3'
      : audioMimeType.includes('mp4') || audioMimeType.includes('m4a')
      ? 'm4a'
      : audioMimeType.includes('wav')
      ? 'wav'
      : audioMimeType.includes('ogg') || audioMimeType.includes('opus')
      ? 'ogg'
      : 'webm';

    const audioFile = new (File as any)(
      [audioBlob],
      `live-lecture-${recordingId}.${extension}`,
      { type: audioMimeType }
    ) as File;

    finalTranscriptRef.current = '';
    transcriptTimelineRef.current = [];
    transcriptSegmentStartTimesRef.current.clear();
    setRecordedTranscript('');
    setRecordingErrorMessage(null);

    if (onUploadRecording) {
      setUploadFilesInFlight([
        {
          id: createUploadFileId(audioFile),
          name: audioFile.name,
          size: audioFile.size,
        },
      ]);
      setUploadContext('record');
      setUploadStage('uploading');
      setHasSubmitted(true);
      setHasObservedUpload(false);

      void Promise.resolve(
        onUploadRecording({
          audioFile,
          transcript,
          timeline: timelineEntries,
          capturedAt: capturedAtIso,
          durationSeconds: recordingDurationSeconds,
        })
      ).catch((error) => {
        const message =
          (error as Error)?.message || 'Failed to upload recording. Please try again.';
        setRecordingErrorMessage(message);
        toast.error(message);
        resetUploadState();
      });
      return;
    }

    const transcriptHeader = `Live Lecture Transcript\nCaptured: ${new Date().toLocaleString()}\nTiming Anchor: Speech Start\n\n`;
    const transcriptBody = timelineTranscript
      ? `${timelineTranscript}\n\nFull Transcript:\n${transcript}`
      : transcript;
    const transcriptFile = new (File as any)(
      [new Blob([`${transcriptHeader}${transcriptBody}\n`], { type: 'text/plain' })],
      `live-lecture-${recordingId}.txt`,
      { type: 'text/plain' }
    ) as File;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(transcriptFile);
    dataTransfer.items.add(audioFile);

    beginTrackedUpload('record', dataTransfer.files);
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
    recordingStatusRef.current = recordingStatus;
  }, [recordingStatus]);

  useEffect(() => {
    if (!isOpen) {
      releaseRecordingResources();
      resetUploadState();
      resetFormState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!onUploadRecording && activeTab === 'record') {
      setActiveTab('files');
    }
  }, [activeTab, onUploadRecording]);

  useEffect(() => {
    if (recordingStatus !== 'recording') return;

    const intervalId = window.setInterval(() => {
      const elapsedSeconds = Math.max(0, Math.floor(getRecordingElapsedSeconds()));
      recordingSecondsRef.current = elapsedSeconds;
      setRecordingSeconds(elapsedSeconds);
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [recordingStatus]);

  useEffect(() => {
    if (
      activeTab !== 'record' &&
      (recordingStatus !== 'idle' ||
        !!recordedTranscript ||
        !!recordingInterimTranscript ||
        !!recordingErrorMessage)
    ) {
      releaseRecordingResources();
      resetRecordingState();
    }
  }, [activeTab, recordingStatus, recordedTranscript, recordingInterimTranscript, recordingErrorMessage]);

  useEffect(() => {
    if (!isOpen || !hasSubmitted) return;

    if (isUploading) {
      setHasObservedUpload(true);

      if (uploadProgress?.phase === 'processing') {
        if (stageTimerRef.current) {
          window.clearTimeout(stageTimerRef.current);
          stageTimerRef.current = null;
        }
        setUploadStage('processing');
        return;
      }

      if (typeof uploadProgress?.overallPercent === 'number') {
        if (stageTimerRef.current) {
          window.clearTimeout(stageTimerRef.current);
          stageTimerRef.current = null;
        }

        setUploadStage(uploadProgress.overallPercent >= 99 ? 'processing' : 'uploading');
        return;
      }

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
  }, [
    isOpen,
    hasSubmitted,
    hasObservedUpload,
    isUploading,
    uploadErrorMessage,
    onClose,
    uploadProgress,
  ]);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
      releaseRecordingResources();
    };
  }, []);

  const isLocked = isUploading || uploadStage === 'uploading' || uploadStage === 'processing';

  const recordingSupported =
    typeof navigator !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const speechRecognitionSupported = !!getSpeechRecognitionConstructor();
  const canStartRecording = recordingSupported && speechRecognitionSupported;

  const isSubmitDisabled =
    isLocked ||
    (requireContentAgreement && !hasAgreed) ||
    (activeTab === 'files'
      ? selectedFiles.length === 0
      : activeTab === 'youtube'
      ? !isValidYouTubeUrl(youtubeUrl)
      : activeTab === 'link'
      ? !isValidPublicUrl(linkUrl)
      : activeTab === 'record'
      ? true
      : !textTitle.trim() || !textContent.trim());

  const isRecordStartDisabled =
    isLocked || (requireContentAgreement && !hasAgreed) || !canStartRecording;

  const stageMessage = useMemo(() => {
    const trackedFileCount = uploadFilesInFlight.length || selectedFiles.length;

    if (uploadStage === 'uploading') {
      if (uploadContext === 'record') {
        return 'Uploading your recording...';
      }

      return uploadContext === 'text'
        ? 'Uploading generated text file...'
        : `Uploading ${trackedFileCount} file${trackedFileCount !== 1 ? 's' : ''}...`;
    }

    if (uploadStage === 'processing') {
      if (uploadContext === 'record') {
        return 'Aligning timestamps and preparing your summary, notes, quizzes, and flashcards...';
      }

      return uploadContext === 'text'
        ? 'Converting text into notes, quizzes, and flashcards...'
        : 'Extracting key ideas and preparing your study set...';
    }

    return '';
  }, [uploadStage, uploadContext, selectedFiles.length, uploadFilesInFlight.length]);

  const perFileProgress = useMemo(() => {
    if (uploadProgress?.files?.length) {
      return uploadProgress.files;
    }

    if (!uploadFilesInFlight.length) {
      return [];
    }

    const fallbackProgress = uploadStage === 'processing' ? 100 : 0;
    const fallbackStatus = uploadStage === 'processing' ? 'processing' : 'queued';

    return uploadFilesInFlight.map((file) => ({
      id: file.id,
      name: file.name,
      progress: fallbackProgress,
      status: fallbackStatus,
      uploadedBytes: fallbackProgress === 100 ? Math.max(1, file.size) : 0,
      totalBytes: Math.max(1, file.size),
    }));
  }, [uploadProgress, uploadFilesInFlight, uploadStage]);

  const overallProgressPercent = useMemo(() => {
    if (typeof uploadProgress?.overallPercent === 'number') {
      return Math.max(0, Math.min(100, Math.round(uploadProgress.overallPercent)));
    }

    if (uploadStage === 'processing') {
      return 100;
    }

    return 0;
  }, [uploadProgress, uploadStage]);

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
                  Upload files, import public links, process a YouTube video, convert text, or live-record audio into structured study material.
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10">
                {availableTabs.map((tab) => {
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

                      {onUploadRecording && (
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
                      )}

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
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center pointer-events-none">
                          <Youtube className="w-5 h-5 text-red-500" />
                        </div>
                        <input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className={`w-full pl-20 pr-14 py-4 rounded-xl border-2 bg-white dark:bg-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                            youtubeUrl && isValidYouTubeUrl(youtubeUrl)
                              ? 'border-emerald-500 focus:ring-emerald-500/30'
                              : youtubeUrl && !isValidYouTubeUrl(youtubeUrl)
                              ? 'border-red-500 focus:ring-red-500/30'
                              : 'border-slate-200 dark:border-white/15 focus:ring-violet-500/30 focus:border-violet-500'
                          }`}
                          disabled={isLocked}
                        />
                        {youtubeUrl && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
                ) : activeTab === 'link' ? (
                  <motion.div
                    key="tab-link"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/60 p-5">
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Public web URL
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center pointer-events-none">
                          <Link className="w-5 h-5 text-cyan-500" />
                        </div>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://en.wikipedia.org/wiki/Earth"
                          className={`w-full pl-20 pr-14 py-4 rounded-xl border-2 bg-white dark:bg-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                            linkUrl && isValidPublicUrl(linkUrl)
                              ? 'border-emerald-500 focus:ring-emerald-500/30'
                              : linkUrl && !isValidPublicUrl(linkUrl)
                              ? 'border-red-500 focus:ring-red-500/30'
                              : 'border-slate-200 dark:border-white/15 focus:ring-violet-500/30 focus:border-violet-500'
                          }`}
                          disabled={isLocked}
                        />
                        {linkUrl && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            {isValidPublicUrl(linkUrl) ? (
                              <Check className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Examples:</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 break-all">
                          Wikipedia pages, public docs, blog posts, news articles, and public course resources.
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
                            {!recordingSupported && (
                              <p className="mt-3 text-xs text-amber-600 dark:text-amber-300 text-center max-w-md">
                                Recording is not available on this browser/device.
                              </p>
                            )}
                            {recordingSupported && !speechRecognitionSupported && (
                              <p className="mt-3 text-xs text-amber-600 dark:text-amber-300 text-center max-w-md">
                                Live transcription is not supported here. Use Chrome or Edge to record and process lectures.
                              </p>
                            )}
                            {recordingErrorMessage && (
                              <p className="mt-3 text-xs text-red-600 dark:text-red-300 text-center max-w-md">
                                {recordingErrorMessage}
                              </p>
                            )}
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

                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/55 p-4 sm:p-5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                Live transcript
                              </p>
                              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-h-28 overflow-y-auto">
                                {recordedTranscript || recordingInterimTranscript ? (
                                  <>
                                    {recordedTranscript}
                                    {recordingInterimTranscript && (
                                      <span className="text-slate-500 dark:text-slate-400 italic"> {recordingInterimTranscript}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-500 dark:text-slate-400">
                                    Start speaking and your transcript will appear here in real time.
                                  </span>
                                )}
                              </div>
                            </div>

                            {recordingErrorMessage && (
                              <p className="text-xs text-red-600 dark:text-red-300 text-center">{recordingErrorMessage}</p>
                            )}

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
                  ? 'Tip: Speak clearly for better live transcription before you stop and process.'
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
                        : activeTab === 'link'
                        ? handleSubmitLink
                        : handleSubmitText
                    }
                    disabled={isSubmitDisabled}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {activeTab === 'youtube'
                      ? 'Process Video'
                      : activeTab === 'link'
                      ? 'Import Link'
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
                      {perFileProgress.length > 0 ? (
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {uploadStage === 'uploading' ? 'Uploading files' : 'Processing files'}
                              </p>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {overallProgressPercent}%
                              </span>
                            </div>
                            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
                                animate={{ width: `${overallProgressPercent}%` }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {perFileProgress.map((progressFile) => {
                              const statusLabel =
                                progressFile.status === 'failed'
                                  ? 'Failed'
                                  : progressFile.status === 'processing'
                                  ? 'Processing'
                                  : progressFile.status === 'completed'
                                  ? 'Uploaded'
                                  : progressFile.status === 'uploading'
                                  ? 'Uploading'
                                  : 'Queued';

                              const statusPillClass =
                                progressFile.status === 'failed'
                                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-200'
                                  : progressFile.status === 'processing'
                                  ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200'
                                  : progressFile.status === 'completed'
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200'
                                  : progressFile.status === 'uploading'
                                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200'
                                  : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300';

                              const progressBarClass =
                                progressFile.status === 'failed'
                                  ? 'h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500'
                                  : 'h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500';

                              return (
                                <div
                                  key={progressFile.id}
                                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3"
                                >
                                  <div className="flex items-center justify-between gap-3 mb-1.5">
                                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                      {progressFile.name}
                                    </p>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${statusPillClass}`}>
                                      {statusLabel}
                                    </span>
                                  </div>

                                  <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                    <motion.div
                                      className={progressBarClass}
                                      animate={{ width: `${Math.max(0, Math.min(100, progressFile.progress))}%` }}
                                      transition={{ duration: 0.2, ease: 'easeOut' }}
                                    />
                                  </div>

                                  <div className="mt-1.5 text-right">
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                      {progressFile.progress}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300">{stageMessage}</p>
                        </div>
                      ) : (
                        <LoadingProgress
                          message={uploadStage === 'uploading' ? 'Uploading' : 'Processing'}
                          stage={stageMessage}
                          variant="upload"
                        />
                      )}
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
