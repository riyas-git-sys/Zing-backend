// server/controllers/message.controller.js
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const sender = req.user._id;

    console.log('Request files:', req.files); // Debug log

    let media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log('Processing file:', file.originalname);
        const result = await uploadToCloudinary(file);
        media.push({
          url: result.secure_url,
          type: result.resource_type,
          name: file.originalname,
          size: result.bytes,
        });
      }
    }

    const message = new Message({
      sender,
      chat: chatId,
      content,
      media,
      recipients: [], // Will be populated based on chat participants
    });

    await message.save();

    // Update last message in chat
    await Chat.findByIdAndUpdate(chatId, { 
      lastMessage: message._id,
      updatedAt: new Date()
    });

    // Populate sender and recipients
    await message.populate('sender', 'name profilePicture mobile');
    
    // Emit socket event for real-time messaging
    // io.to(chatId).emit('newMessage', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params; // Changed from messageId to id

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.readBy.includes(req.user._id)) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    res.json(message);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: error.message });
  }
};