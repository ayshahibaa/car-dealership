import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('unknown routes', () => {
  it('returns a 404 with a consistent error JSON shape', async () => {
    const app = createApp();

    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: 'No route for GET /api/does-not-exist' } });
  });
});
