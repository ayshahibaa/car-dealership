/**
 * Error type the UI can recognise (mirrors an HTTP status), shared by every
 * service — the local demo dataset (carService.js) and the real backend
 * (apiClient.js) both throw this same shape so pages never need to branch
 * on which kind of call failed.
 */
export class ServiceError extends Error {
  constructor(message, { status = 500, details = null } = {}) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.details = details;
  }
}
