import { v2 as cloudinary } from 'cloudinary';
import stream from 'stream';
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

// For serverless environments (Vercel), we need to upload directly from buffer
export const uploadToCloudinary = async (file) => {
  try {
    if (!file) {
      console.log('No file provided to uploadToCloudinary');
      return null;
    }

    console.log('Uploading file to Cloudinary:', {
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      hasBuffer: !!file.buffer,
      hasPath: !!file.path
    });

    // For Vercel/serverless environments, use buffer upload
    if (file.buffer) {
      console.log('Using buffer upload for serverless environment');
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'chat_app',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful:', result.secure_url);
              resolve(result);
            }
          }
        );

        // Create a buffer stream and pipe to Cloudinary
        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(uploadStream);
      });
    }
    
    // For local development with file path
    if (file.path) {
      const fs = await import('fs');
      
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
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log('Local file deleted:', file.path);
      }

      return result;
    }

    throw new Error('No file buffer or path available for upload');

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export default cloudinary;