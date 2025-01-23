import fs from 'fs';
import path from 'path';
import sharp from 'sharp'; // Ensure sharp is installed: npm install sharp
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));


// Image compression controller
export const compressImageController = async (req, res) => {
  const { compressionLevel } = req.body;
  const { filename } = req.file;

  // Ensure the file is an image
  const validImageTypes = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = path.extname(filename).toLowerCase();

  if (!validImageTypes.includes(fileExtension)) {
    throw new ApiError(400, 'Invalid file type. Only .jpg, .jpeg, .png, and .webp are supported');
  }

  const filePath = path.resolve(__dirname, '..', '..', 'public', 'temp', filename);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Uploaded file not found');
  }

  try {
    // Compress the image based on the specified level
    const compressedImageBuffer = await compressImage(filePath, compressionLevel);

    const compressedImagePath = path.resolve(__dirname, '..', '..', 'public', 'temp', `compressed-${filename}`);

    fs.writeFileSync(compressedImagePath, compressedImageBuffer);

    res.status(200).json(new ApiResponse(true, 'Image compressed successfully', compressedImagePath));
  } catch (error) {
    throw new ApiError(500, 'Error compressing image');
  }
};

// Compress image based on the compression level
const compressImage = async (imagePath, compressionLevel) => {
  let resizeWidth, quality;

  // Set compression parameters based on level
  switch (compressionLevel) {
    case 'low':
      resizeWidth = 3600;  // Larger size for low compression
      quality = 90;        // Lower compression to keep quality higher
      break;
    case 'medium':
      resizeWidth = 2400;  // Medium size
      quality = 80;        // Moderate compression
      break;
    case 'high':
      resizeWidth = 1600;   // Smaller size for high compression
      quality = 70;        // Higher compression to reduce size
      break;
    default:
      resizeWidth = 2600;
      quality = 80;
      break;
  }

  try {
    const compressedImageBuffer = await sharp(imagePath)  // Use buffer here instead of path
      .resize(resizeWidth)                           // Resize image according to the level
      .jpeg({ quality: quality })                    // Adjust the quality for jpg
      .png({ quality: quality })                     // Adjust the quality for png
      .webp({ quality: quality })                    // Adjust the quality for webp
      .toBuffer();                                  // Convert to buffer
    
    return compressedImageBuffer;
  } catch (err) {
    console.error(`Error compressing image:`, err);
    throw new ApiError(500, 'Error compressing image');
  }
};
