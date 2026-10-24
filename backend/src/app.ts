import express, { type Express } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.router.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/**
 * Builds the Express app without starting a listener, so tests (Supertest)
 * and the real server (src/server.ts) share the exact same wiring.
 *
 * Route modules are mounted here as they're built (auth, vehicles, ...);
 * notFoundHandler and errorHandler must always stay last.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/health', healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
