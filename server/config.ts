export const config = {
  port: Number(process.env.PORT || 3000),
  dataMode: process.env.DATA_MODE === 'live' ? 'live' as const : 'mock' as const,
  crmReadEnabled: process.env.CRM_READ_ENABLED === 'true',
  crmWriteEnabled: process.env.CRM_WRITE_ENABLED === 'true',
  safeTestMode: process.env.SAFE_TEST_MODE !== 'false',
  aiEnabled: process.env.AI_ENABLED === 'true',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  openRouterKey: process.env.OPENROUTER_API_KEY || '',
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  aiFastModel: process.env.AI_MODEL_FAST || 'openai/gpt-5.6-luna',
  aiQualityModel: process.env.AI_MODEL_QUALITY || 'openai/gpt-5.6-sol',
  locations: [
    { brand: 'WallPanels', locationId: process.env.GHL_WALLPANELS_LOCATION_ID || '', token: process.env.GHL_WALLPANELS_TOKEN || '' },
    { brand: 'Verona Home', locationId: process.env.GHL_VERONA_LOCATION_ID || '', token: process.env.GHL_VERONA_TOKEN || '' },
  ],
  contactAllowlist: new Set((process.env.WRITE_ALLOWLIST_CONTACT_IDS || '').split(',').map(x => x.trim()).filter(Boolean)),
  opportunityAllowlist: new Set((process.env.WRITE_ALLOWLIST_OPPORTUNITY_IDS || '').split(',').map(x => x.trim()).filter(Boolean)),
}
export type Location = (typeof config.locations)[number]
