-- Stop serving conversation data while HighLevel's contact filter is verified.
revoke select, insert, update, delete on table
 public.copilot_crm_conversations_cache,
 public.copilot_crm_messages_cache,
 public.copilot_crm_calls_cache
from service_role;
