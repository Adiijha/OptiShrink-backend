import { Router } from 'express';
import multer from 'multer';
import { compressImageController } from '../controllers/img.controller.js';
import { verifyJWT, optionalVerifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Setup Multer for image file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/temp');  // Destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // Unique filename
  },
});

const upload = multer({ storage: storage });

/**
 * Route for compressing an image
 * @route POST /api/v1/images/compress
 * @body { compressionLevel: 'low' | 'medium' | 'high' }
 * @file { image }
 */
router.post('/optimize-img', upload.single('image'), optionalVerifyJWT, compressImageController);

export default router;
