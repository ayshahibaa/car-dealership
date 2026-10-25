import { appConfig } from '../config/appConfig.js';
import { ServiceError } from './ServiceError.js';

/**
 * apiClient.js — the one place that talks to the real backend (Phases
 * B1-B5: auth, listing your own car, editing/deleting a listing, buying,
 * admin restock). Browsing the catalog (getCars, getCarById, ...) still
 * reads the local demo dataset — see carService.js's file comment for why.
 *
 * Every call resolves to the parsed JSON body, or throws a ServiceError
 * built from the backend's `{ error: { message, details? } }` shape (see
 * backend/src/middleware/errorHandler.ts) — the same error type the rest of
 * the app already catches from carService's local functions.
 */
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  let response;
  try {
    response = await fetch(`${appConfig.api.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // The backend isn't a demo dataset — it has to actually be running.
    throw new ServiceError(
      'Could not reach the server. Make sure the backend is running and reachable at the configured API URL.',
      { status: 0 },
    );
  }

  // 204 No Content (e.g. DELETE /vehicles/:id) has no body to parse.
  const text = response.status === 204 ? '' : await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed (${response.status})`;
    throw new ServiceError(message, { status: response.status, details: payload?.error?.details ?? null });
  }

  return payload;
}
