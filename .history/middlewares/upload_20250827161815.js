// middlewares/upload.js
import multer from 'multer';

// Use memory storage for Vercel (serverless environment)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow images, videos, and other common media types
  const filetypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|pdf|doc|docx|txt/;
  const extname = filetypes.test(file.originalname.toLowerCase().split('.').pop());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image, video, and document files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 25 * 1024 * 1024, // 25MB limit for files
  },
});

// Export both single and array upload options
export const uploadSingle = upload.single('profilePicture');
export const uploadArray = upload.array('media', 20); // Max 10 files
export const uploadAny = upload.any(); // For mixed file types

export default upload;