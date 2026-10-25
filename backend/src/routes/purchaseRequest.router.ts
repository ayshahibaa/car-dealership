import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  approvePurchaseRequest,
  createPurchaseRequest,
  listMyPurchaseRequests,
  listPendingPurchaseRequests,
  rejectPurchaseRequest,
} from '../purchaseRequests/purchaseRequestService.js';
import type { PurchaseRequestRepository } from '../purchaseRequests/purchaseRequestRepository.js';
import type { VehicleRepository } from '../vehicles/vehicleRepository.js';

/**
 * Mounted at /api/purchase-requests. Takes both repositories as parameters
 * (same DI-for-testing pattern as vehicle.router.ts) since approving a
 * request has to touch both the request and the vehicle's stock.
 *
 * Permissions: every route needs a logged-in user; /pending and the
 * approve/reject decisions are admin-only. There's no public listing here —
 * a request is only ever visible to the buyer who made it or an admin.
 */
export function createPurchaseRequestRouter(repo: PurchaseRequestRepository, vehicleRepo: VehicleRepository): Router {
  const router = Router();

  router.post('/', requireAuth, async (req, res, next) => {
    try {
      const vehicleId = req.body?.vehicleId;
      if (typeof vehicleId !== 'string' || !vehicleId) {
        throw new ApiError(400, 'vehicleId is required');
      }
      const request = await createPurchaseRequest(repo, vehicleRepo, vehicleId, req.user!.userId);
      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  });

  router.get('/mine', requireAuth, async (req, res, next) => {
    try {
      const requests = await listMyPurchaseRequests(repo, req.user!.userId);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  });

  router.get('/pending', requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const requests = await listPendingPurchaseRequests(repo);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/approve', requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const request = await approvePurchaseRequest(repo, vehicleRepo, req.params.id as string, req.user!.userId);
      res.status(200).json(request);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/reject', requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const request = await rejectPurchaseRequest(repo, req.params.id as string, req.user!.userId);
      res.status(200).json(request);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
