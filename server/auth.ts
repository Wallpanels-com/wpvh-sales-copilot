import type { FastifyRequest } from 'fastify'
import { authClient, db, requireDb, userDb } from './db.js'

export interface Profile { id: string; email: string; full_name: string; role: 'sales' | 'admin'; active: boolean }
export interface Mapping { location_id: string; ghl_user_id: string; brand: string }
export interface Session { profile: Profile; mappings: Mapping[] }
export class ApiError extends Error {
  constructor(public code: string, public status = 400) { super(code) }
}
export async function sessionFromRequest(request: FastifyRequest): Promise<Session> {
  const token = request.headers.authorization?.replace(/^Bearer /i, '')
  if (!token || !authClient) throw new ApiError('UNAUTHENTICATED', 401)
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData.user) throw new ApiError('UNAUTHENTICATED', 401)
  const database = db || userDb(token)
  const { data: profile, error } = await database.from('copilot_profiles').select('*').eq('id', userData.user.id).eq('active', true).single()
  if (error || !profile) throw new ApiError('PROFILE_NOT_PROVISIONED', 403)
  const { data: mappings, error: mappingError } = await database.from('copilot_user_ghl_mappings')
    .select('location_id,ghl_user_id').eq('profile_id', profile.id)
  if (mappingError) throw new ApiError('DATABASE_UNAVAILABLE', 503)
  return { profile: profile as Profile, mappings: (mappings || []).map((m: any) => ({ location_id: m.location_id, ghl_user_id: m.ghl_user_id, brand: m.location_id === process.env.GHL_WALLPANELS_LOCATION_ID ? 'WallPanels' : m.location_id === process.env.GHL_VERONA_LOCATION_ID ? 'Verona Home' : 'Unknown' })).filter(m => m.brand !== 'Unknown') }
}
export function requireMapping(session: Session, locationId: string) {
  const mapping = session.mappings.find(m => m.location_id === locationId)
  if (!mapping) throw new ApiError('LOCATION_FORBIDDEN', 403)
  return mapping
}
export async function requireOwnedOpportunity(session: Session, locationId: string, opportunityId: string, contactId?: string) {
  const mapping = requireMapping(session, locationId)
  const { data, error } = await requireDb().from('copilot_crm_opportunities_cache').select('*')
    .eq('location_id', locationId).eq('opportunity_id', opportunityId).eq('assigned_to', mapping.ghl_user_id).single()
  if (error || !data || (contactId && data.contact_id !== contactId)) throw new ApiError('FORBIDDEN', 403)
  return data
}
