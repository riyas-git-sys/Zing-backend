// controllers/chat.controller.js
import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const createChat = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    
    // Check if body exists and has participants
    if (!req.body || !req.body.participants) {
      return res.status(400).json({ 
        message: 'Participants array is required in request body' 
      });
    }

    const { participants } = req.body;
    const currentUserId = req.user._id;

    // Validate that participants is an array
    if (!Array.isArray(participants)) {
      return res.status(400).json({ message: 'Participants must be an array' });
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([...participants, currentUserId.toString()])];

    // Check if chat already exists between these users (for 1-on-1 chats)
    if (allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { 
          $all: allParticipants, 
          $size: allParticipants.length 
        },
      }).populate('participants', 'name profilePicture mobile');

      if (existingChat) {
        return res.status(200).json(existingChat);
      }
    }

    const chat = new Chat({
      participants: allParticipants,
      isGroup: allParticipants.length > 2,
      name: allParticipants.length > 2 ? req.body.name : undefined,
      admins: allParticipants.length > 2 ? [currentUserId] : undefined,
    });

    await chat.save();
    await chat.populate('participants', 'name profilePicture mobile');
    
    res.status(201).json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createGroupChat = async (req, res) => {
  try {
    console.log('Group chat request body:', req.body);
    
    if (!req.body || !req.body.name || !req.body.participants) {
      return res.status(400).json({ 
        message: 'Name and participants are required in request body' 
      });
    }

    const { name, participants } = req.body;

    if (participants.length < 2) {
      return res.status(400).json({ message: 'Group must have at least 2 members besides yourself' });
    }

    const currentUserId = req.user._id;
    const allParticipants = [...new Set([...participants, currentUserId.toString()])];

    const chat = new Chat({
      name,
      participants: allParticipants,
      isGroup: true,
      admins: [currentUserId], // Set creator as first admin
    });

    await chat.save();
    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admins', 'name profilePicture mobile');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.user._id] },
    })
      .populate('participants', 'name profilePicture mobile')
      .populate('admins', 'name profilePicture mobile')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name profilePicture mobile')
      .populate('admins', 'name profilePicture mobile')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profilePicture mobile')
      .populate('readBy', 'name profilePicture mobile');

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Exclude the current user from the results
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name profilePicture mobile status')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    // If query is empty, return all users (except current user)
    if (!query || query.trim().length === 0) {
      const users = await User.find({ _id: { $ne: req.user._id } })
        .select('name profilePicture mobile status')
        .sort({ name: 1 });
      return res.json(users);
    }
    
    if (query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { mobile: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    }).select('name profilePicture mobile status');

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add addToGroup function (for adding new users)
export const addToGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    // Check if current user is admin
    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    // Check if user is already a participant
    if (chat.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is already in the group' });
    }

    // Add user to participants
    chat.participants.push(userId);
    await chat.save();

    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admins', 'name profilePicture mobile');

    res.json(chat);
  } catch (error) {
    console.error('Add to group error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateGroupPicture = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Check if file was uploaded (comes from multer middleware)
    if (!req.file) {
      return res.status(400).json({ message: 'No picture file provided' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    // Check if user is admin or participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Upload the picture to Cloudinary
    const result = await uploadToCloudinary(req.file);
    chat.picture = result.secure_url;
    
    await chat.save();
    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admins', 'name profilePicture mobile');

    res.json(chat);
  } catch (error) {
    console.error('Update group picture error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, description } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    // Check if user is admin
    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Only admin can update group information' });
    }

    // Update fields
    if (name) chat.name = name;
    if (description !== undefined) chat.description = description;

    await chat.save();
    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admins', 'name profilePicture mobile');

    res.json(chat);
  } catch (error) {
    console.error('Update group info error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add leave group function
export const leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    // Remove user from participants
    chat.participants = chat.participants.filter(
      participant => participant.toString() !== req.user._id.toString()
    );

    // If admin leaves and there are other participants, assign new admin
    if (chat.admins.includes(req.user._id.toString()) && chat.participants.length > 0) {
      // Assign a new admin from remaining participants
      const newAdmin = chat.participants.find(p => p.toString() !== req.user._id.toString());
      if (newAdmin) {
        chat.admins = [newAdmin];
      }
    }

    await chat.save();

    // If no participants left, delete the group
    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
      return res.json({ message: 'Group deleted as no members remain' });
    }

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const promoteToAdmin = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    // Check if current user is admin
    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Only admin can promote members' });
    }

    // Check if target user is a participant
    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    // Check if user is already admin
    if (chat.admins.includes(userId)) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    // Add user to admins
    chat.admins.push(userId);
    await chat.save();

    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admins', 'name profilePicture mobile');

    res.json(chat);
  } catch (error) {
    console.error('Promote to admin error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const demoteAdmin = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    // Check if current user is admin
    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Only admin can demote admins' });
    }

    // Check if target user is an admin
    if (!chat.admins.includes(userId)) {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    // Cannot demote yourself if you're the only admin
    if (userId === req.user._id.toString() && chat.admins.length === 1) {
      return res.status(400).json({ message: 'Cannot demote yourself as the only admin' });
    }

    // Remove user from admins
    chat.admins = chat.admins.filter(adminId => adminId.toString() !== userId);
    await chat.save();

    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admins', 'name profilePicture mobile');

    res.json(chat);
  } catch (error) {
    console.error('Demote admin error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const removeFromGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    // FIX: Check if current user is admin (correct way)
    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }

    // Check if target user is a participant
    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    // Cannot remove yourself as admin
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot remove themselves. Use leave group instead.' });
    }

    // Remove user from participants
    chat.participants = chat.participants.filter(
      participant => participant.toString() !== userId
    );

    await chat.save();
    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admins', 'name profilePicture mobile'); // FIX: Changed 'admin' to 'admins'

    res.json(chat);
  } catch (error) {
    console.error('Remove from group error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }

    // FIX: Check if user is admin (correct way)
    if (!chat.admins.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Only admin can delete the group' });
    }

    // Delete all messages in the group first
    await Message.deleteMany({ chat: chatId });

    // Delete the group
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: error.message });
  }
};