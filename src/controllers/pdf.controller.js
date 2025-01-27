import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
dotenv.config();

export const compressPdfController = asyncHandler(async (req, res) => {
    if (!req.file || !req.file.path) {
        throw new ApiError(400, 'PDF file is required');
    }

    try {
        // Define compression profiles based on the level
        const compressionProfiles = {
            low: {
                'ImageOptimizationFormat': 'JPEG',
                'JPEGQuality': 40,
                'ResampleImages': true,
                'ResamplingResolution': 150,
                'GrayscaleImages': false
            },
            medium: {
                'ImageOptimizationFormat': 'JPEG',
                'JPEGQuality': 20,
                'ResampleImages': true,
                'ResamplingResolution': 120,
                'GrayscaleImages': false
            },
            high: {
                'ImageOptimizationFormat': 'JPEG',
                'JPEGQuality': 10,
                'ResampleImages': true,
                'ResamplingResolution': 100,
                'GrayscaleImages': true
            }
        };

        // Set the compression level (default to 'medium' if not provided)
        const compressionLevel = req.body.compressionLevel || 'medium';
        const selectedProfile = compressionProfiles[compressionLevel] || compressionProfiles['medium'];

        // Step 1: Upload PDF to PDF.co
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path)); // Read the file from the request
        form.append('name', `compressed-${Date.now()}.pdf`);

        const uploadResponse = await axios.post('https://api.pdf.co/v1/file/upload', form, {
            headers: {
                ...form.getHeaders(),
                'x-api-key': process.env.PDFCO_API_KEY, // Ensure API key is set correctly
            },
        });

        if (uploadResponse.data.error) {
            throw new ApiError(500, `PDF upload failed: ${uploadResponse.data.message}`);
        }

        const uploadedFileUrl = uploadResponse.data.url;
        console.log("PDF uploaded to PDF.co:", uploadedFileUrl);

        // Step 2: Compress the PDF using PDF.co with selected compression profile
        const compressionResponse = await axios.post(
            'https://api.pdf.co/v1/pdf/optimize',
            {
                url: uploadedFileUrl, // URL from PDF.co upload
                name: `compressed-${Date.now()}.pdf`,
                async: false, // Sync compression
                profiles: JSON.stringify(selectedProfile), // Apply the selected profile
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.PDFCO_API_KEY,
                }
            }
        );

        console.log('Compression API Response:', compressionResponse.data);

        if (compressionResponse.data.error) {
            throw new ApiError(500, `PDF compression failed: ${compressionResponse.data.message}`);
        }

        // Step 3: Send the compressed PDF details
        res.status(200).json(
            new ApiResponse(true, 'PDF compressed successfully', {
                compressedPdfUrl: compressionResponse.data.url,
                originalFileSize: req.file.size,
                compressedFileSize: compressionResponse.data.fileSize,
                pageCount: compressionResponse.data.pageCount,
            })
        );

        // Step 4: Delete the file locally after processing is done
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error(`Error deleting the file: ${err.message}`);
            } else {
                console.log('Local PDF file deleted successfully');
            }
        });

    } catch (err) {
        console.error('Error during PDF compression:', err.message || err);
        throw new ApiError(500, `Error compressing PDF: ${err.message || err.response?.data?.message || 'Unknown error'}`);

        // Step 5: In case of an error, ensure file is deleted
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error(`Error deleting the file: ${err.message}`);
            } else {
                console.log('Local PDF file deleted successfully after error');
            }
        });
    }
});
