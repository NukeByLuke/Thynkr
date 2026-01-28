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
  'text/plain',
  'application/octet-stream',
]);

const allowedDocumentExtensions = new Set(['.pdf', '.docx', '.doc', '.txt', '.ppt', '.pptx', '.pps', '.ppsx']);

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Allow images for avatar uploads, documents for other uploads
  const imageMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

  if (file.fieldname === 'avatar') {
    if (imageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only PNG, JPG, GIF, and WEBP are allowed for avatars.'));
    }
    return;
  }

  // Default: allow document uploads
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (allowedDocumentMimeTypes.has(mime) || allowedDocumentExtensions.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC/DOCX, TXT, and PPT/PPTX files are allowed.'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 10, // Max 10 files at once
  },
});
