import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface SignOptions {
  secret?: string;
  expiresIn?: string | number;
}

const DEFAULT_EXPIRY = '24h';

export function signAccessToken(payload: AccessTokenPayload, options: SignOptions = {}): string {
  const secret = options.secret ?? env.jwtSecret;
  return jwt.sign(payload, secret, { expiresIn: options.expiresIn ?? DEFAULT_EXPIRY } as jwt.SignOptions);
}

export function verifyAccessToken(token: string, secret: string = env.jwtSecret): AccessTokenPayload {
  return jwt.verify(token, secret) as AccessTokenPayload & jwt.JwtPayload;
}
