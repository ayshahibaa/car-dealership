import express, { type Express } from 'express';
import cors from 'cors';

/**
 * Builds the Express app without starting a listener, so tests (Supertest)
 * and the real server (src/server.ts) share the exact same wiring.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
}

export default createApp;
