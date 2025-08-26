import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file) => {
  try {
    if (!file) return null;

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'auto',
      folder: 'chat_app',
    });

    // Delete file from local storage
    fs.unlinkSync(file.path);

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Delete file from local storage if upload fails
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

export default cloudinary;