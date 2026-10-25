import { createApp } from '../src/app.js';

/**
 * Vercel's Node.js runtime treats a file under api/ that default-exports a
 * (req, res) => void handler as a serverless function — an Express app
 * satisfies that signature directly, so no adapter is needed. This is the
 * ONLY entrypoint Vercel uses; src/server.ts (app.listen()) is for running
 * the API outside Vercel (locally, or on a traditional Node host) and is
 * never invoked here. See backend/vercel.json for how every request path
 * gets routed to this one function.
 */
export default createApp();
