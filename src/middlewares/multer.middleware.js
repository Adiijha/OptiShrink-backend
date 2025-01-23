import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the 'public/temp' directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './public/temp';
    ensureDirectoryExists(uploadDir);  // Ensure the directory exists
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using the original name and current timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);  // Get file extension
    const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, fileName);  // Set the file's unique name
  }
});

// File type filter (allowing more file types such as Word, PowerPoint, and others)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',  // PDF
    'text/plain',        // Text
    'application/json',  // JSON
    'application/zip',   // ZIP
    'application/x-tar', // TAR
    'application/msword',  // Word (.doc, .docx)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word (.docx)
    'application/vnd.ms-powerpoint',  // PowerPoint (.ppt)
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint (.pptx)
    'application/vnd.ms-excel',  // Excel (.xls)
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel (.xlsx)
    'application/vnd.ms-office',  // Microsoft Office files
    'image/jpeg',  // JPEG images
    'image/png',   // PNG images
    'image/gif',   // GIF images
    'image/bmp',   // BMP images
    'image/webp',  // WEBP images
    'image/tiff',  // TIFF images
    'image/svg+xml' // SVG images
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type'), false);  // Reject unsupported files
  }
  cb(null, true);  // Accept the file
};

// Create multer instance with storage, file size limit, and file filter
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB file size limit
});
