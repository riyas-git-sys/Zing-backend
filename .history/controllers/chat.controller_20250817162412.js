const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const Message = require('../models/message.model');

exports.createChat = async (req, res) => {
  try {
    const { participants } = req.body;

    // Check if chat already exists between these users
    const existingChat = await Chat.findOne({
      isGroup: false,
      participants: { $all: participants, $size: participants.length },
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const chat = new Chat({
      participants,
    });

    await chat.save();

    // Populate participants
    await chat.populate('participants', 'name profilePicture mobile');

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGroupChat = async (req, res) => {
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

exports.getUserChats = async (req, res) => {
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

exports.getChatMessages = async (req, res) => {
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

exports.searchUsers = async (req, res) => {
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

exports.addToGroup = async (req, res) => {
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