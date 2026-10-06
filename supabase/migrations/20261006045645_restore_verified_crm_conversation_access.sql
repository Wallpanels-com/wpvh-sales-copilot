-- The sync now verifies source contact and location before caching a thread.
grant select, insert, update, delete on table
 public.copilot_crm_conversations_cache,
 public.copilot_crm_messages_cache,
 public.copilot_crm_calls_cache
to service_role;
