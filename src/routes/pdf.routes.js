import express from 'express';
import multer from 'multer';
import { compressPdfController } from '../controllers/pdf.controller.js';

const router = express.Router();

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/temp'); // Save uploaded file to temp folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Route for compressing PDF
router.post('/compress-pdf', upload.single('file'), compressPdfController);

export default router;
