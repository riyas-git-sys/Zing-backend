import express from 'express';
import { sendMessage, markAsRead } from '../controllers/message.controller.js';
import upload from '../middlewares/upload.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/', auth, upload.array('media', 10), sendMessage);
// Fix the parameter name to match what your controller expects
router.put('/:id/read', auth, markAsRead);

export default router;