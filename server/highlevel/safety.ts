import { config } from '../config.js'
import { ApiError, type Session } from '../auth.js'

export function assertCRMWriteAllowed(args: { session: Session; locationId: string; contactId: string; opportunityId: string; idempotencyKey: string }) {
  if (!config.crmWriteEnabled) throw new ApiError('WRITE_DISABLED', 423)
  if (!args.idempotencyKey) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 400)
  if (!args.session.mappings.some(m => m.location_id === args.locationId)) throw new ApiError('FORBIDDEN', 403)
  if (config.safeTestMode && (!config.contactAllowlist.has(args.contactId) || !config.opportunityAllowlist.has(args.opportunityId))) {
    throw new ApiError('TARGET_NOT_ALLOWLISTED', 403)
  }
}
