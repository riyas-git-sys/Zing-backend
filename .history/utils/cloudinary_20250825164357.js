// utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import 'dotenv/config';

// Debug: Check if environment variables are loaded
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET'
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file) => {
  try {
    if (!file) {
      console.log('No file provided to uploadToCloudinary');
      return null;
    }

    console.log('Uploading file to Cloudinary:', {
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    });

    // Check if file exists locally
    if (!fs.existsSync(file.path)) {
      console.error('File does not exist at path:', file.path);
      throw new Error('File not found on server');
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'auto',
      folder: 'chat_app',
    });

    console.log('Cloudinary upload successful:', result.secure_url);

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