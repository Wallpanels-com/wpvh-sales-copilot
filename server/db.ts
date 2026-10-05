import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'

export const db = config.supabaseUrl && config.supabaseServiceRoleKey
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null
export const authClient = config.supabaseUrl && config.supabaseAnonKey
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

export function userDb(token: string) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('DATABASE_UNAVAILABLE')
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

export function requireDb() {
  if (!db) throw new Error('DATABASE_UNAVAILABLE')
  return db
}
