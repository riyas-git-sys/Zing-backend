import Chat from '../models/chat.model.js';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';

// Use export const instead of exports.functionName
export const createChat = async (req, res) => {
  try {
    const { participants } = req.body;
    const currentUserId = req.user._id;

    // Add current user to participants if not already included
    const allParticipants = [...new Set([...participants, currentUserId.toString()])];

    // Check if chat already exists between these users (for 1-on-1 chats)
    if (allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: allParticipants, $size: allParticipants.length },
      });

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
    res.status(500).json({ message: error.message });
  }
};

export const createGroupChat = async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (participants.length < 2) {
      return res.status(400).json({ message: 'Group must have at least 2 members' });
    }

    const chat = new Chat({
      name,
      participants,
      isGroup: true,
      admin: req.user._id,
    });

    await chat.save();

    // Populate participants and admin
    await chat.populate('participants', 'name profilePicture mobile');
    await chat.populate('admin', 'name profilePicture mobile');

    res.status(201).json(chat);
  } catch (error) {
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
    res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { mobile: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    }).select('name profilePicture mobile');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addToGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(chatId);
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
    res.status(500).json({ message: error.message });
  }
};