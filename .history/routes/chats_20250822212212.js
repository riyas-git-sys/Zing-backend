import express from 'express';
import {
  createChat,
  createGroupChat,
  getUserChats,
  getChatMessages,
  searchUsers,
  addToGroup
} from '../controllers/chat.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

router.get('/', getUserChats);
router.post('/', createChat);
router.post('/group', createGroupChat);
router.get('/search', searchUsers);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/add-member', addToGroup);
api.delete = (url: string, data?: any) => {
  return api.request({
    method: 'DELETE',
    url,
    data,
  });
};
export default router;