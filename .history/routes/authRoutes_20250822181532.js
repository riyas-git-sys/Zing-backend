import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';

const router = express.Router();

// Unified route definitions
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/user/:id', authController.getUser);

// Add a /me endpoint for getting current user
router.get('/me', async (req, res) => {
  // This would require authentication middleware
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;