import { appConfig } from '../config/appConfig.js';
import { ServiceError } from './ServiceError.js';

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
    throw new ServiceError(
      'Could not reach the server. Make sure the backend is running and reachable at the configured API URL.',
      { status: 0 },
    );
  }

  const text = response.status === 204 ? '' : await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed (${response.status})`;
    throw new ServiceError(message, { status: response.status, details: payload?.error?.details ?? null });
  }

  return payload;
}
