import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Start server only when not running in test runner (port 5000)
const isRunningTest = process.env.NODE_ENV === 'test' || 
                      process.execArgv.includes('--test') || 
                      process.argv.some(arg => typeof arg === 'string' && arg.includes('test'));

let server = null;
if (!isRunningTest) {
  server = app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(` Stratagem AI Decision Intelligence Platform Server `);
    console.log(` Running on: http://localhost:${config.port}`);
    console.log(` Environment: ${config.env}`);
    console.log(` Health check: http://localhost:${config.port}/api/health`);
    console.log(`=================================================`);
  });
}

export { app, server };
