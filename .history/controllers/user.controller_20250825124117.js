// server/controllers/user.controller.js
import User from '../models/user.model.js';

export const updatePreferences = async (req, res) => {
  try {
    const { theme, notifications } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        preferences: {
          theme: theme || 'light',
          notifications: notifications !== undefined ? notifications : true
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences || { theme: 'light', notifications: true });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: error.message });
  }
};