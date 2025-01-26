import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { User } from '../models/user.models.js';  // Import User model

dotenv.config();

// Helper function to dynamically adjust compression
const getCompressionSettings = (compressionLevel) => {
  let transformation;
  
  switch (compressionLevel) {
    case 'low':
      transformation = { 
        width: 2400, 
        quality: 80, 
        crop: 'scale', 
        fetch_format: 'auto',
      }; 
      break;
    case 'medium':
      transformation = { 
        width: 1600, 
        quality: 60, 
        crop: 'scale', 
        fetch_format: 'auto', 
      }; 
      break;
    case 'high':
      transformation = { 
        width: 1200, 
        quality: 40, // More aggressive compression
        crop: 'scale', 
        fetch_format: 'auto', 
      }; 
      break;
    default:
      transformation = { 
        width: 2400, 
        quality: 70, 
        crop: 'scale', 
        fetch_format: 'auto', 
      }; 
  }

  return transformation;
};

// Image compression controller using Cloudinary and your existing upload utility
export const compressImageController = asyncHandler(async (req, res) => {
  const { compressionLevel } = req.body;
  let files = req.files;

  // Handle the case where only a single file is uploaded
  if (!files) {
    if (req.file) {
      files = [req.file];
    } else {
      throw new ApiError(400, 'No files uploaded');
    }
  }

  const compressedUrls = [];

  // Iterate over each uploaded file
  for (const file of files) {
    const { filename, path: localFilePath } = file;

    // Ensure the file is an image
    const validImageTypes = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = path.extname(filename).toLowerCase();

    if (!validImageTypes.includes(fileExtension)) {
      throw new ApiError(400, `Invalid file type for file: ${filename}. Only .jpg, .jpeg, .png, and .webp are supported`);
    }

    if (!fs.existsSync(localFilePath)) {
      throw new ApiError(404, `Uploaded file ${filename} not found`);
    }

    // Get dynamic compression settings based on the chosen level
    const transformation = getCompressionSettings(compressionLevel);

    // Upload to Cloudinary using the existing upload utility with dynamic transformation
    const { success, url, error } = await uploadOnCloudinary(localFilePath, {
      folder: 'compressed-images', // Optional: specify a folder in Cloudinary
      transformation: [transformation], // Apply transformations dynamically based on compression level
    });

    if (!success) {
      throw new ApiError(500, error || `Failed to upload file ${filename} to Cloudinary`);
    }

    // Clean up the local file after successful upload
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error(`Error deleting temporary file ${filename}:`, err);
      } else {
        console.log(`Temporary file ${filename} deleted successfully`);
      }
    });

    // Add the Cloudinary URL and compression date to the compressedUrls array
    compressedUrls.push({ url, compressedAt: new Date() });
  }

  // If the user is logged in (i.e., req.user is set), save the compressed image URLs and dates to their history
  if (req.user) {
    const user = await User.findById(req.user._id);  // Assuming user ID is stored in req.user

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Add the compressed image URLs and dates to the user's `compressedImages` field
    user.compressedImages.push(...compressedUrls);

    await user.save();
  }

  // Send success response with the Cloudinary URLs and compression dates
  res.status(200).json(new ApiResponse(true, 'Images compressed and uploaded successfully', compressedUrls));
});
