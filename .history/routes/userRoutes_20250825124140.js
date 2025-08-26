// server/routes/userRoutes.js
import express from 'express';
import { updatePreferences, getPreferences } from '../controllers/user.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.post('/preferences', updatePreferences);
router.get('/preferences', getPreferences);

export default router;