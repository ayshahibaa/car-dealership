import type { AccessTokenPayload } from '../auth/jwt.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth once the bearer token has been verified. */
      user?: AccessTokenPayload;
    }
  }
}

export {};
