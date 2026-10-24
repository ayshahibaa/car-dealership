import { z } from 'zod';

/** Registration is stricter than login: this is where a weak password gets rejected. */
export const registerSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Login deliberately doesn't re-check password strength — an existing account
 * may predate a rule change, and failing to find a match (bad credentials) is
 * the right error either way, not a validation error.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
