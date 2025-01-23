import fs from 'fs';
import path from 'path';
import sharp from 'sharp'; // Ensure this is installed: npm install sharp
import { PDFDocument } from 'pdf-lib';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import pkg from 'pdf2image'; // PDF to image converter
const { pdf2img } = pkg;
import { asyncHandler } from '../utils/asyncHandler.js';
import pdfPoppler from 'pdf-poppler'; // PDF to image converter
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Controller for PDF compression with selectable levels
export const compressPdfController = asyncHandler(async (req, res) => {

  const filePath = path.resolve(__dirname, '..', '..', 'public', 'temp', req.file.filename);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Uploaded file not found');
  }

  const fileBuffer = fs.readFileSync(filePath);
  
  // Get the compression level from the request body (low, medium, or high)
  const compressionLevel = req.body.compressionLevel || 'medium';  // Default to medium if not provided

  // Convert the PDF into images (one per page)
  const pdfImages = await convertPdfToImages(filePath);

  // Compress images based on the chosen compression level
  const compressedImages = await compressImages(pdfImages, compressionLevel);

  // Create a new PDF from the compressed images
  const newPdfBuffer = await createPdfFromImages(compressedImages);

  const compressedPdfPath = path.resolve(__dirname, '..', '..', 'public', 'temp', `compressed-${req.file.filename}`);

  fs.writeFileSync(compressedPdfPath, newPdfBuffer);

  // Delete the individual images to save space
  pdfImages.forEach((image) => {
    try {
      fs.unlinkSync(image); // Delete the image file
    } catch (err) {
      console.error(`Error deleting image ${image}:`, err);
    }
  });

  res.status(200).json(new ApiResponse(true, 'File compressed successfully', compressedPdfPath));
});


// Convert PDF pages to images
const convertPdfToImages = async (filePath) => {
  const outputDir = path.dirname(filePath); // Use the same directory as input
  const options = {
    format: 'jpeg', // Output format
    out_dir: outputDir, // Output directory
    out_prefix: path.basename(filePath, path.extname(filePath)), // Output file prefix
    page: null, // Process all pages
  };

  try {
    await pdfPoppler.convert(filePath, options); // Convert the PDF
    
    const files = fs.readdirSync(outputDir); // Get all files in the output directory
    
    const imageFiles = files.filter((file) => file.startsWith(options.out_prefix) && file.endsWith('.jpg'));
    
    if (imageFiles.length === 0) {
      throw new ApiError(500, 'No images were extracted from the PDF');
    }
    
    
    return imageFiles.map((file) => path.join(outputDir, file));
  } catch (err) {
    console.error('Error converting PDF to images:', err);
    throw new ApiError(500, 'Error converting PDF to images');
  }
};

// Compress images based on the selected compression level
const compressImages = (images, compressionLevel) => {
  let resizeWidth, quality;

  // Adjust the compression based on the level
  switch (compressionLevel) {
    case 'low':
      resizeWidth = 2400;  // Larger size for low compression
      quality = 90;        // Lower compression to keep quality higher
      break;
    case 'medium':
      resizeWidth = 2000;   // Medium size
      quality = 80;        // Moderate compression
      break;
    case 'high':
      resizeWidth = 1600;   // Smaller size for high compression
      quality = 70;        // Higher compression to reduce size
      break;
    default:
      resizeWidth = 2000;
      quality = 80;
      break;
  }

  return Promise.all(
    images.map(async (image) => {
      try {
        const compressedImageBuffer = await sharp(image)  // Use buffer here instead of path
          .resize(resizeWidth)                           // Resize image according to the level
          .jpeg({ quality: quality })                    // Adjust the quality
          .toBuffer();                                  // Convert to buffer
        
        return compressedImageBuffer;
      } catch (err) {
        console.error(`Error compressing image:`, err);
        throw new ApiError(500, 'Error compressing image');
      }
    })
  );
};



// Create a new PDF from the compressed images
const createPdfFromImages = async (images) => {
  const pdfDoc = await PDFDocument.create();

  for (const imageBuffer of images) {
    const image = await pdfDoc.embedJpg(imageBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0 });
  }

  return await pdfDoc.save();
};
