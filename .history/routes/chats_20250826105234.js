// routes/chats.js
import express from 'express';
import {
  createChat,
  createGroupChat,
  getUserChats,
  getChatMessages,
  searchUsers,
  addToGroup,
  getAllUsers,
  updateGroupPicture,
  leaveGroup,
  promoteToAdmin,
  removeFromGroup,
} from '../controllers/chat.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

router.get('/', getUserChats);
router.post('/', createChat); // This should handle creating 1-on-1 chats
router.get('/users', (req, res, next) => {
  console.log('GET /api/chats/users route hit');
  next();
}, getAllUsers);
router.post('/group', createGroupChat); // This should handle group chats
router.get('/search', searchUsers);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/add-member', addToGroup);
router.put('/:chatId/picture', upload.single('picture'), updateGroupPicture);
router.post('/:chatId/leave', leaveGroup);
router.post('/:chatId/promote-admin', promoteToAdmin);
router.post('/:chatId/remove-member', removeFromGroup);

export default router;