// server/server.js
import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import 'dotenv/config';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rizchat';

const server = http.createServer(app);

// Improved MongoDB connection with better error handling
mongoose.connect(MONGO_URI)
.then(() => {
  console.log('Connected to MongoDB');
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    console.log('Environment variables loaded:');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT SET');
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET');
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// MongoDB connection events
mongoose.connection.on('connected', () => console.log('MongoDB connected'));
mongoose.connection.on('error', (err) => console.log('MongoDB error:', err));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: 'https://zing-chat-g3pfv3fd7-riyas-git-sys-projects.vercel.app/', // Your deployed frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});