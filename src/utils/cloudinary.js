import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return { success: false, error: "Invalid file path" };

        // Upload to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // Delete local file after successful upload
        try {
            fs.unlinkSync(localFilePath);
        } catch (fsError) {
            console.error("Error deleting local file:", fsError);
        }

        return { success: true, url: response.secure_url, data: response };

    } catch (error) {
        // Ensure local file is deleted even if upload fails
        if (fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
            } catch (fsError) {
                console.error("Error deleting local file after upload failure:", fsError);
            }
        }

        console.error("Error uploading file on Cloudinary:", error);
        return { success: false, error: "Failed to upload file to Cloudinary" };
    }
};

export { uploadOnCloudinary };