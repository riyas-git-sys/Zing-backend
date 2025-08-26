import express from 'express';
import { sendMessage, markAsRead } from '../controllers/message.controller.js';
import upload from '../middlewares/upload.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/', auth, upload.array('media', 10), sendMessage);
router.put('/:messageId/read', auth, markAsRead);  // Check this parameter

export default router;