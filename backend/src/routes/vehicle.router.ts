import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicles,
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

/**
 * Takes the repository as a parameter instead of importing the Prisma-backed
 * one directly, so this router can be tested end-to-end against a fake
 * repository (status codes, auth rules) with no database — same pattern as
 * auth.router.ts. The real app wires it up with prismaVehicleRepository.
 *
 * Permissions: listing/search are public; create and update are open to any
 * logged-in user; delete is admin-only.
 */
export function createVehicleRouter(repo: VehicleRepository): Router {
  const router = Router();

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
      const vehicle = await updateVehicle(repo, req.params.id as string, req.body);
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

  return router;
}
