import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

/**
 * The health endpoint is the smallest possible slice of the API: no database,
 * no auth, nothing to mock. It exists so every later phase (auth, vehicles,
 * purchase/restock) is added to an app that was already provably running and
 * tested, and so the test harness itself (Vitest + Supertest + the Express
 * app factory) is proven out before anything else depends on it.
 */
describe('GET /api/health', () => {
  it('responds 200 with a JSON status payload', async () => {
    const app = createApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('reports JSON content type', async () => {
    const app = createApp();

    const response = await request(app).get('/api/health');

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
