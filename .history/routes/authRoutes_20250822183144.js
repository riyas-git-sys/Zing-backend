import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';
import auth from '../middlewares/auth.js'; // Import the auth middleware

const router = express.Router();

// Unified route definitions
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/user/:id', authController.getUser);

// Implement the /me endpoint with authentication
router.get('/me', auth, authController.getCurrentUser);

export default router;