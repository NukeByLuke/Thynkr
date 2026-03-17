import multer from 'multer';
import path from 'path';
import { randomBytes } from 'crypto';
import fs from 'fs/promises';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

// Configure storage
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const allowedDocumentMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/ogg',
  'video/webm',
  'video/mp4',
  'text/plain',
  'application/octet-stream',
]);

const allowedDocumentExtensions = new Set([
  '.pdf',
  '.docx',
  '.doc',
  '.txt',
  '.ppt',
  '.pptx',
  '.pps',
  '.ppsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.webm',
  '.mp4',
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
]);

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Allow images for avatar/banner uploads, documents for other uploads
  const imageMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

  if (file.fieldname === 'avatar' || file.fieldname === 'banner') {
    if (imageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only PNG, JPG, GIF, and WEBP are allowed.'));
    }
    return;
  }

  // Default: allow document uploads
  const mime = (file.mimetype || '').toLowerCase();
  const normalizedMime = mime.split(';')[0].trim();
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (
    allowedDocumentMimeTypes.has(mime) ||
    allowedDocumentMimeTypes.has(normalizedMime) ||
    allowedDocumentExtensions.has(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed: PDF, DOC/DOCX, TXT, PPT/PPTX, images (PNG/JPG/JPEG/GIF/WEBP), and media (WEBM/MP3/WAV/M4A/MP4/OGG).'
      )
    );
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB per file
    files: 10, // Max 10 files at once
    fieldSize: 10 * 1024 * 1024, // Allow large transcript/timeline payloads
    fields: 20,
    parts: 30,
  },
});
