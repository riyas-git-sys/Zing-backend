// server/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// ES Modules equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(express.json()); // This is the key fix - parse JSON bodies
app.use(express.urlencoded({ extended: true }));
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? 'https://zing-chat.vercel.app' // Your deployed frontend URL
//     : 'http://localhost:5173',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://zing-chat-rho.vercel.app', // Your frontend domain
      'http://localhost:5173' // For local development
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Requested-With']
}));

// Add this after your CORS configuration
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'https://zing-chat-rho.vercel.app');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//   next();
// });

// Handle preflight requests
app.options('*', cors());
// app.options('*', (req, res) => {
//   res.header('Access-Control-Allow-Origin', 'https://zing-chat-rho.vercel.app');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//   res.sendStatus(200);
// });

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
import messageRoutes from './routes/message.routes.js';
import { profile } from 'console';

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Test route
app.get('/api', (req, res) => {
  res.json({ 
    status: 'API is working',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'PUT /api/auth/profile',
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;