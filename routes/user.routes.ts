// backend/routes/user.routes.ts - SAME AS BEFORE
import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Use authentication middleware
router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;
