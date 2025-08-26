import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import 'dotenv/config';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rizchat';

const server = http.createServer(app);

server.on('error', (error) => {
  console.error('Server error:', error);
});

// Improved MongoDB connection with options
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Remove these if using MongoDB 6+ (they're deprecated)
  // useCreateIndex: true,
  // useFindAndModify: false
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Only start server after DB connection
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

mongoose.connection.on('connected', () => console.log('MongoDB connected'));
mongoose.connection.on('error', (err) => console.log('MongoDB error:', err));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});