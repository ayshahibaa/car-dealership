import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  approveVehicleListing,
  createVehicle,
  deleteVehicle,
  getVehicle,
  listAllVehicles,
  listPendingVehicles,
  listVehicles,
  rejectVehicleListing,
  restockVehicle,
  updateVehicle,
} from '../vehicles/vehicleService.js';
import type { VehicleFilter, VehicleRepository } from '../vehicles/vehicleRepository.js';

function parseFilter(query: Record<string, unknown>): VehicleFilter {
  const filter: VehicleFilter = {};
  if (typeof query.make === 'string') filter.make = query.make;
  if (typeof query.model === 'string') filter.model = query.model;
  if (typeof query.category === 'string') filter.category = query.category;
  if (typeof query.minPrice === 'string') filter.minPrice = Number(query.minPrice);
  if (typeof query.maxPrice === 'string') filter.maxPrice = Number(query.maxPrice);
  return filter;
}

export function createVehicleRouter(repo: VehicleRepository): Router {
  const router = Router();

  router.get('/admin/all', requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const vehicles = await listAllVehicles(repo);
      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/pending', requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const vehicles = await listPendingVehicles(repo);
      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  });

  router.get('/search', async (req, res, next) => {
    try {
      const vehicles = await listVehicles(repo, parseFilter(req.query as Record<string, unknown>));
      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const hasFilter = Object.keys(req.query).length > 0;
      const vehicles = await listVehicles(repo, hasFilter ? parseFilter(req.query as Record<string, unknown>) : undefined);
      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const vehicle = await getVehicle(repo, req.params.id as string);
      if (!vehicle) {
        next(new ApiError(404, 'Vehicle not found'));
        return;
      }
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', requireAuth, async (req, res, next) => {
    try {
      const vehicle = await createVehicle(repo, req.body, req.user!.userId);
      res.status(201).json(vehicle);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', requireAuth, async (req, res, next) => {
    try {
      const { approvalStatus: _approvalStatus, quantity: _quantity, listingStatus: _listingStatus, ...editable } = req.body ?? {};
      const vehicle = await updateVehicle(repo, req.params.id as string, editable);
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
      await deleteVehicle(repo, req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/approve', requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const vehicle = await approveVehicleListing(repo, req.params.id as string);
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/reject', requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const vehicle = await rejectVehicleListing(repo, req.params.id as string);
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/restock', requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const vehicle = await restockVehicle(repo, req.params.id as string);
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
