// backend/routes/auth.routes.ts - SAME AS BEFORE
import express from 'express';
import { registerUser, loginUser, verifyUser, getAllUsers, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/verify', authenticate, verifyUser);
router.get('/users', authenticate, getAllUsers);
router.put('/change-password', authenticate, changePassword);

export default router;
