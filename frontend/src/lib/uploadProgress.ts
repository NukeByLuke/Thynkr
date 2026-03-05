export type UploadProgressPhase = 'uploading' | 'processing';

export interface UploadProgressFile {
  id: string;
  name: string;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'failed';
}

export interface UploadProgressSnapshot {
  overallPercent: number;
  phase: UploadProgressPhase;
  files: UploadProgressFile[];
}

export type StudyUploadStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface StudyUploadServerFile {
  id: string;
  originalName: string;
  fileSize: number;
  status: StudyUploadStatus | string;
}

function normalizeStudyUploadStatus(status: string | null | undefined): StudyUploadStatus | 'UNKNOWN' {
  if (!status) return 'UNKNOWN';

  const normalized = status.toUpperCase();
  if (normalized === 'UPLOADED' || normalized === 'PROCESSING' || normalized === 'COMPLETED' || normalized === 'FAILED') {
    return normalized;
  }

  return 'UNKNOWN';
}

function createServerMatchKey(name: string, size: number): string {
  return `${name}::${Math.max(1, Number(size) || 0)}`;
}

function createServerFileBuckets(serverFiles: StudyUploadServerFile[]): Map<string, StudyUploadServerFile[]> {
  const buckets = new Map<string, StudyUploadServerFile[]>();

  for (const file of serverFiles) {
    const key = createServerMatchKey(file.originalName, file.fileSize);
    const existing = buckets.get(key);
    if (existing) {
      existing.push(file);
    } else {
      buckets.set(key, [file]);
    }
  }

  return buckets;
}

export function createServerProcessingUploadProgress(
  files: File[],
  serverFiles: StudyUploadServerFile[],
  elapsedMs: number
): UploadProgressSnapshot {
  if (!files.length) {
    return {
      overallPercent: 100,
      phase: 'processing',
      files: [],
    };
  }

  const totalBytes = files.reduce((sum, file) => sum + getSafeFileBytes(file), 0);
  const normalizedElapsedMs = Math.max(0, Number(elapsedMs) || 0);
  const processingPercent = Math.min(98, 72 + Math.floor(normalizedElapsedMs / 900) * 2);

  const buckets = createServerFileBuckets(serverFiles || []);
  let aggregateUploadedBytes = 0;

  const progressFiles = files.map((file) => {
    const fileTotalBytes = getSafeFileBytes(file);
    const bucket = buckets.get(createServerMatchKey(file.name, file.size));
    const matchedServerFile = bucket?.shift();
    const normalizedStatus = normalizeStudyUploadStatus(matchedServerFile?.status);

    let progress = processingPercent;
    let status: UploadProgressFile['status'] = 'processing';

    if (normalizedStatus === 'FAILED') {
      progress = 100;
      status = 'failed';
    } else if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'UPLOADED') {
      progress = 100;
      status = 'completed';
    }

    const uploadedBytes = Math.round((Math.max(0, Math.min(100, progress)) / 100) * fileTotalBytes);
    aggregateUploadedBytes += uploadedBytes;

    return {
      id: createUploadFileId(file),
      name: file.name,
      progress,
      uploadedBytes,
      totalBytes: fileTotalBytes,
      status,
    };
  });

  const overallPercent = Math.max(
    0,
    Math.min(100, Math.round((Math.min(totalBytes, aggregateUploadedBytes) / totalBytes) * 100))
  );

  return {
    overallPercent,
    phase: 'processing',
    files: progressFiles,
  };
}

export function isStudyUploadProcessingComplete(serverFiles: StudyUploadServerFile[]): boolean {
  if (!Array.isArray(serverFiles) || serverFiles.length === 0) {
    return true;
  }

  return serverFiles.every(
    (file) => normalizeStudyUploadStatus(file?.status) !== 'PROCESSING'
  );
}

export function hasStudyUploadFailures(serverFiles: StudyUploadServerFile[]): boolean {
  if (!Array.isArray(serverFiles) || serverFiles.length === 0) {
    return false;
  }

  return serverFiles.some((file) => normalizeStudyUploadStatus(file?.status) === 'FAILED');
}

export function createUploadFileId(file: Pick<File, 'name' | 'size' | 'lastModified'>): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

function getSafeFileBytes(file: File): number {
  return Math.max(1, Number(file.size) || 0);
}

export function createQueuedUploadProgress(files: File[]): UploadProgressSnapshot {
  return {
    overallPercent: 0,
    phase: 'uploading',
    files: files.map((file) => ({
      id: createUploadFileId(file),
      name: file.name,
      progress: 0,
      uploadedBytes: 0,
      totalBytes: getSafeFileBytes(file),
      status: 'queued',
    })),
  };
}

export function createProcessingUploadProgress(files: File[]): UploadProgressSnapshot {
  return {
    overallPercent: 100,
    phase: 'processing',
    files: files.map((file) => ({
      id: createUploadFileId(file),
      name: file.name,
      progress: 100,
      uploadedBytes: getSafeFileBytes(file),
      totalBytes: getSafeFileBytes(file),
      status: 'processing',
    })),
  };
}

export function buildUploadProgressSnapshot(
  files: File[],
  loadedBytes: number,
  phase: UploadProgressPhase = 'uploading'
): UploadProgressSnapshot {
  if (!files.length) {
    return {
      overallPercent: phase === 'processing' ? 100 : 0,
      phase,
      files: [],
    };
  }

  const totalBytes = files.reduce((sum, file) => sum + getSafeFileBytes(file), 0);
  const clampedLoadedBytes = Math.max(0, Math.min(Number(loadedBytes) || 0, totalBytes));
  let remainingLoadedBytes = clampedLoadedBytes;

  const progressFiles = files.map((file) => {
    const fileTotalBytes = getSafeFileBytes(file);
    const fileLoadedBytes = Math.max(0, Math.min(fileTotalBytes, remainingLoadedBytes));
    remainingLoadedBytes = Math.max(0, remainingLoadedBytes - fileLoadedBytes);

    let progress = Math.round((fileLoadedBytes / fileTotalBytes) * 100);
    if (phase === 'uploading' && progress > 99 && fileLoadedBytes < fileTotalBytes) {
      progress = 99;
    }

    const status: UploadProgressFile['status'] =
      phase === 'processing'
        ? 'processing'
        : progress >= 100
        ? 'completed'
        : progress > 0
        ? 'uploading'
        : 'queued';

    return {
      id: createUploadFileId(file),
      name: file.name,
      progress,
      uploadedBytes: fileLoadedBytes,
      totalBytes: fileTotalBytes,
      status,
    };
  });

  const rawOverallPercent = Math.round((clampedLoadedBytes / totalBytes) * 100);
  const overallPercent =
    phase === 'processing'
      ? 100
      : rawOverallPercent >= 100 && clampedLoadedBytes < totalBytes
      ? 99
      : rawOverallPercent;

  return {
    overallPercent,
    phase,
    files: progressFiles,
  };
}