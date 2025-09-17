import express from 'express';
import {
  sendMessage,
  getSentMessages,
} from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// ✅ Debug: Check if imports are functions
console.log('🔍 Route handlers:', {
  sendMessage: typeof sendMessage,
  getSentMessages: typeof getSentMessages,
  authenticate: typeof authenticate
});

// Apply authentication to all routes
router.use(authenticate);

// Define routes
router.post('/', sendMessage);       // POST /api/messages
router.get('/', getSentMessages);    // GET /api/messages

// ✅ CRITICAL: Must be default export
export default router;
