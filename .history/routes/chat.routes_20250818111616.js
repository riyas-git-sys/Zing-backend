import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../validations/auth.validation';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

export default router;