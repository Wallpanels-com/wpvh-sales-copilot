import { config } from '../config.js'
import { ApiError } from '../auth.js'

export async function ghlRequest<T>(locationId: string, path: string, options: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<T> {
  const location = config.locations.find(l => l.locationId === locationId && l.locationId)
  if (!location?.token) throw new ApiError('CRM_UNAVAILABLE', 503)
  if ((options.method || 'GET') === 'GET' && !config.crmReadEnabled) throw new ApiError('CRM_READ_DISABLED', 423)
  if (options.method === 'POST' && !config.crmWriteEnabled) throw new ApiError('WRITE_DISABLED', 423)
  const response = await fetch(`https://services.leadconnectorhq.com${path}`, {
    method: options.method || 'GET',
    headers: { Authorization: `Bearer ${location.token}`, Version: 'v3', Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    const code = response.status === 401 ? 'CRM_TOKEN_INVALID'
      : response.status === 403 ? 'CRM_SCOPE_DENIED'
      : response.status === 404 ? 'CRM_ENDPOINT_NOT_FOUND'
      : response.status === 429 ? 'CRM_RATE_LIMITED'
      : response.status === 400 || response.status === 422 ? 'CRM_INVALID_REQUEST'
      : 'CRM_UNAVAILABLE'
    throw new ApiError(code, response.status === 429 ? 429 : 503)
  }
  return response.json() as Promise<T>
}
