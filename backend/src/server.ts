import { createApp } from './app.js';
import { env } from './config/env.js';

/**
 * Real entrypoint — not imported by tests. Tests use createApp() directly
 * via Supertest, so they never bind a real port.
 */
const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Autoza API listening on http://localhost:${env.port}`);
});
