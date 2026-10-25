import express, { type Express } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.router.js';
import { createAuthRouter } from './routes/auth.router.js';
import { createVehicleRouter } from './routes/vehicle.router.js';
import { createPurchaseRequestRouter } from './routes/purchaseRequest.router.js';
import { prismaUserRepository } from './auth/prismaUserRepository.js';
import { prismaVehicleRepository } from './vehicles/prismaVehicleRepository.js';
import { prismaPurchaseRequestRepository } from './purchaseRequests/prismaPurchaseRequestRepository.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', createAuthRouter(prismaUserRepository));
  app.use('/api/vehicles', createVehicleRouter(prismaVehicleRepository));
  app.use('/api/purchase-requests', createPurchaseRequestRouter(prismaPurchaseRequestRepository, prismaVehicleRepository));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
