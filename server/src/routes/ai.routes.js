import { Router } from 'express';
import {
  getAiStatus,
  testKey,
  saveKey,
  generateGeminiBrief,
  askDecisionAssistant
} from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public / auth-free status & test endpoints
router.get('/status', getAiStatus);
router.post('/test-key', testKey);

// Authenticated endpoints
router.post('/save-key', authenticate, saveKey);
router.post('/decision/:id/brief', authenticate, generateGeminiBrief);
router.post('/decision/:id/ask', authenticate, askDecisionAssistant);

export default router;
