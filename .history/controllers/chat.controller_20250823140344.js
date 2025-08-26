// controllers/chat.controller.js
import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';

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
      admin: allParticipants.length > 2 ? currentUserId : undefined,
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
    console.log('Group chat request body:', req.body); // Debug log
    
    // Check if body exists and has required fields
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
      admin: currentUserId,
    });

    await chat.save();
    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admin', 'name profilePicture mobile');

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
      .populate('admin', 'name profilePicture mobile')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Get user chats error:', error);
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

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
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

    if (chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    if (chat.participants.includes(userId)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    chat.participants.push(userId);
    await chat.save();

    await chat.populate('participants', 'name profilePicture mobile');

    res.json(chat);
  } catch (error) {
    console.error('Add to group error:', error);
    res.status(500).json({ message: error.message });
  }
};