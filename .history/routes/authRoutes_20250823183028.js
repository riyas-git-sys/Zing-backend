import express from 'express';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';
import auth from '../middlewares/auth.js'; // Import the auth middleware
import upload from '../middlewares/upload.js';

const router = express.Router();

// Unified route definitions
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/user/:id', authController.getUser);

// Add debug logging for profile route
// router.put('/profile', auth, (req, res, next) => {
//   console.log('PUT /profile route hit');
//   next();
// }, upload.single('profilePicture'), (req, res, next) => {
//   console.log('File uploaded:', req.file ? req.file.originalname : 'No file');
//   next();
// }, authController.updateProfile);

router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Clean up user data (optional)
    try {
      // Remove user from all chats
      const Chat = await import('../models/chat.model.js');
      await Chat.default.updateMany(
        { participants: userId },
        { $pull: { participants: userId } }
      );

      // Delete empty chats
      await Chat.default.deleteMany({ participants: { $size: 0 } });

      // Update messages (mark as deleted user)
      const Message = await import('../models/message.model.js');
      await Message.default.updateMany(
        { sender: userId },
        { $set: { 'sender.deleted': true } }
      );
    } catch (cleanupError) {
      console.warn('Cleanup error (non-critical):', cleanupError);
      // Continue with account deletion even if cleanup fails
    }

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Server error during account deletion' });
  }
});
// Implement the /me endpoint with authentication
router.get('/me', auth, authController.getCurrentUser);

router.get('/debug-token', auth, (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({
      message: 'Token is valid',
      decoded: decoded,
      user: req.user
    });
  } catch (error) {
    res.status(401).json({ 
      message: 'Token verification failed',
      error: error.message 
    });
  }
});

export default router;