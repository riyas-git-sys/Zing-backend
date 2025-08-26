import express from 'express';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';
import auth from '../middlewares/auth.js'; // Import the auth middleware

const router = express.Router();

// Unified route definitions
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or mobile number'
      });
    }

    // Create new user
    const user = new User({ name, email, mobile, password });
    await user.save();

    // Generate token (you'll need to implement this)
    const token = user.generateAuthToken();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login route
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    // Find user by email or mobile
    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete account route - ADD THIS
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

router.get('/user/:id', authController.getUser);


export default router;