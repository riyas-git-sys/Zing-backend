import { body } from 'express-validator';

export const registerSchema = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email'),
  body('mobile').isMobilePhone().withMessage('Invalid mobile number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

export const loginSchema = [
  body('emailOrMobile').notEmpty().withMessage('Email or mobile is required'),
  body('password').notEmpty().withMessage('Password is required')
];