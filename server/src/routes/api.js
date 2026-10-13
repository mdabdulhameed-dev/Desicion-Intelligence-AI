import { Router } from 'express';
import authRoutes from './auth.routes.js';
import decisionRoutes from './decision.routes.js';
import aiRoutes from './ai.routes.js';

const api = Router();

api.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Stratagem AI Decision Intelligence Core',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

api.use('/auth', authRoutes);
api.use('/decisions', decisionRoutes);
api.use('/ai', aiRoutes);

export default api;
