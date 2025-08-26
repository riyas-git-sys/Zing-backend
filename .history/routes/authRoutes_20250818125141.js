import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';

const router = express.Router();

// Unified route definitions
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/user/:id', authController.getUser);  // Ensure getUser exists in controller

// Method Not Allowed handlers
router.route('/register')
  .all((req, res) => {
    res.set('Allow', 'POST');
    res.status(405).json({ message: 'Method Not Allowed' });
  });

export default router;