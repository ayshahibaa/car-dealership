import 'dotenv/config';

/**
 * Reads process.env once, in one place, with sane local-dev fallbacks.
 * Nothing else in the app should read process.env directly — that keeps
 * every environment-dependent decision visible here.
 */
export const env = Object.freeze({
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
});
