import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import digestRouter from './routes/digest.js';
import topicRouter from './routes/topic.js';
import newsRouter from './routes/news.js';
import { startScheduler, stopScheduler } from './services/newsScheduler.js';
import authMiddleware from './middleware/auth.js';
import { generalLimiter, strictLimiter } from './middleware/rateLimiter.js';
import { setupSwagger } from '../swagger.js';

const app = express();
const PORT = env.PORT;

// Enable CORS for all origins
app.use(cors());

// Apply the general rate limiter to all incoming traffic.
app.use(generalLimiter);

// Parse JSON bodies for incoming requests
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date()
  });
});

// API Routes mounting
// Note: Both routers are mounted at /api. 
// Depending on internal route structure, they might overlap or extend.
app.use('/api', authMiddleware);
app.use('/api', strictLimiter, digestRouter);
app.use('/api', topicRouter);
app.use('/api', strictLimiter, newsRouter);

// Serve the generated OpenAPI documentation.
setupSwagger(app);

// Start the server
// Added a check to avoid starting the server during tests if needed, 
// though exporting the app is the main requirement for testing.
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  void startScheduler().catch((error) => {
    console.error('[index] Failed to start news scheduler', {
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack
    });
  });

  const shutdown = (signal) => {
    console.log(`\n[index] Received ${signal}. Shutting down gracefully...`);
    
    stopScheduler();
    
    const timeoutId = setTimeout(() => {
      console.error('[index] Forcefully shutting down due to timeout');
      process.exit(1);
    }, 10000);

    server.close(() => {
      console.log('[index] HTTP server closed');
      clearTimeout(timeoutId);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Global error handler for unexpected failures.
app.use((error, request, response, next) => {
  console.error('[index] Unhandled error', error);

  return response.status(error?.status ?? 500).json({
    success: false,
    error: error?.message ?? 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
  });
});

// Export the app for testing
export default app;
