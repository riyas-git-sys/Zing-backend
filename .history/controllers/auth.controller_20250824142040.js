import User from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';

export const updateProfile = async (req, res) => {
  try {
    console.log('PUT /profile route hit');
    console.log('File uploaded:', req.file ? req.file.originalname : 'No file');
    
    const { name, status } = req.body;
    const userId = req.user._id;

    let updateData = { name, status };

    // Handle file upload if provided
    if (req.file) {
      console.log('Uploading profile picture:', req.file.originalname);
      const result = await uploadToCloudinary(req.file);
      updateData.profilePicture = result.secure_url;
      console.log('Profile picture uploaded successfully:', result.secure_url);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profilePicture: user.profilePicture,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
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

    // Generate token
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
};

export const login = async (req, res) => {
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
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // The auth middleware already attached the user to req.user
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { register, login, getUser, getCurrentUser, updateProfile };