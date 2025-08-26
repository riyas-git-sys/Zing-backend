// server/routers/message.routes.js
import express from 'express';
import { sendMessage, markAsRead, clearChat } from '../controllers/message.controller.js';
import upload from '../middlewares/upload.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.post('/', auth, upload.array('media', 10), sendMessage);

// Make sure this uses proper parameter format with colon
router.put('/:id/read', auth, markAsRead); // Should be :id not messageId or anything else
router.delete('/chat/:chatId', auth, clearChat);

export default router;