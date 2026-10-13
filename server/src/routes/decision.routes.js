import { Router } from 'express';
import multer from 'multer';
import {
  listDecisions,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision,
  duplicateDecision,
  runAnalysis,
  runSimulation,
  ingestData
} from '../controllers/decision.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createDecisionSchema,
  updateDecisionSchema,
  simulateDecisionSchema
} from '../schemas/decision.schema.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const router = Router();

// All decision routes require authentication
router.use(authenticate);

router.get('/', listDecisions);
router.post('/', validate(createDecisionSchema), createDecision);
router.post('/ingest', upload.single('file'), ingestData);

router.get('/:id', getDecisionById);
router.put('/:id', validate(updateDecisionSchema), updateDecision);
router.delete('/:id', deleteDecision);
router.post('/:id/duplicate', duplicateDecision);

router.post('/:id/analyze', runAnalysis);
router.post('/:id/simulate', validate(simulateDecisionSchema), runSimulation);

export default router;
