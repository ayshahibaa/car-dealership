import { Router } from 'express';
import { loginSchema, registerSchema } from '../auth/authSchemas.js';
import { loginUser, registerUser } from '../auth/authService.js';
import type { UserRepository } from '../auth/userRepository.js';
import { ApiError } from '../middleware/errorHandler.js';

export function createAuthRouter(repo: UserRepository): Router {
  const router = Router();

  router.post('/register', async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new ApiError(400, 'Invalid registration details', parsed.error.flatten()));
      return;
    }

    try {
      const result = await registerUser(repo, parsed.data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      next(new ApiError(400, 'Invalid login details', parsed.error.flatten()));
      return;
    }

    try {
      const result = await loginUser(repo, parsed.data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
