import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import chatRoutes from './routes/chats.js';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// ES Modules equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(express.json()); // This is the key fix - parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use('/api/chats', chatRoutes);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    dbState: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
  });
});

// Import and use routes - UNCOMMENT THESE
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chats.js';
// import messageRoutes from './routes/message.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
// app.use('/api/messages', messageRoutes);

// Test route
app.get('/api', (req, res) => {
  res.json({ 
    status: 'API is working',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;