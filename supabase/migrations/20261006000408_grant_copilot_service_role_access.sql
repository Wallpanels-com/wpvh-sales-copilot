-- The Copilot tables were created with SQL, so the server role needs explicit
-- table grants in addition to its RLS bypass. Keep the grant scoped to this app.
grant select, insert, update, delete on table
 public.copilot_action_audit_log,
 public.copilot_ai_call_state,
 public.copilot_ai_lead_state,
 public.copilot_ai_lessons,
 public.copilot_ai_usage_log,
 public.copilot_crm_calls_cache,
 public.copilot_crm_contacts_cache,
 public.copilot_crm_conversations_cache,
 public.copilot_crm_messages_cache,
 public.copilot_crm_opportunities_cache,
 public.copilot_crm_pipelines_cache,
 public.copilot_crm_tasks_cache,
 public.copilot_locations,
 public.copilot_profiles,
 public.copilot_sync_state,
 public.copilot_user_ghl_mappings,
 public.copilot_user_preferences
to service_role;
