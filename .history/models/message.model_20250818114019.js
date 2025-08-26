import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  content: {
    type: String,
    trim: true,
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document'],
    },
    name: String,
    size: Number,
  }],
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);
export default Message;