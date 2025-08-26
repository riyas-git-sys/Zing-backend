import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';

const router = express.Router();

// Unified route definitions
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/user/:id', authController.getUser); // Make sure this has colon before id

// Remove the problematic route.route() section
// Add proper method not allowed handlers if needed:
router.all('/register', (req, res) => {
  res.set('Allow', 'POST');
  res.status(405).json({ message: 'Method Not Allowed' });
});

router.all('/login', (req, res) => {
  res.set('Allow', 'POST');
  res.status(405).json({ message: 'Method Not Allowed' });
});

router.all('/user/:id', (req, res) => {
  res.set('Allow', 'GET');
  res.status(405).json({ message: 'Method Not Allowed' });
});

export default router;