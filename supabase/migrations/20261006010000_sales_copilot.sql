-- Sales Copilot tables are isolated from the existing wpvh-sales-control application.
create table if not exists public.copilot_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null, full_name text not null, role text not null check (role in ('sales','admin')),
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.copilot_locations (
 location_id text primary key, brand text not null check (brand in ('WallPanels','Verona Home')),
 enabled boolean not null default true
);
create table if not exists public.copilot_user_ghl_mappings (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.copilot_profiles(id) on delete cascade,
 location_id text not null references public.copilot_locations(location_id), ghl_user_id text not null,
 created_at timestamptz not null default now(), unique(profile_id, location_id)
);
create table if not exists public.copilot_user_preferences (
 profile_id uuid primary key references public.copilot_profiles(id) on delete cascade,
 default_workspace text not null default 'All', notifications_enabled boolean not null default true,
 working_hours jsonb not null default '{}'::jsonb, signature text not null default ''
);
create table if not exists public.copilot_crm_contacts_cache (
 location_id text not null, contact_id text not null, first_name text, last_name text, email text, phone text,
 company_name text, dnd boolean not null default false, raw_json jsonb not null default '{}'::jsonb,
 source_updated_at timestamptz, synced_at timestamptz not null default now(), primary key(location_id,contact_id)
);
create table if not exists public.copilot_crm_opportunities_cache (
 location_id text not null, opportunity_id text not null, contact_id text not null, assigned_to text,
 pipeline_id text, pipeline_name text, pipeline_stage_id text, pipeline_stage_name text,
 status text, monetary_value numeric, name text, source text, raw_json jsonb not null default '{}'::jsonb,
 source_updated_at timestamptz, synced_at timestamptz not null default now(), primary key(location_id,opportunity_id)
);
create index if not exists copilot_opportunities_owner_idx on public.copilot_crm_opportunities_cache(location_id,assigned_to,status);
create table if not exists public.copilot_crm_conversations_cache (
 location_id text not null, conversation_id text not null, contact_id text not null,
 last_message_at timestamptz, last_message_direction text, last_message_type text,
 unread_count integer not null default 0, raw_json jsonb not null default '{}'::jsonb,
 synced_at timestamptz not null default now(), primary key(location_id,conversation_id)
);
create table if not exists public.copilot_crm_messages_cache (
 location_id text not null, message_id text not null, conversation_id text not null, contact_id text not null,
 direction text, channel text, body text, user_id text, message_type text,
 created_at timestamptz, raw_json jsonb not null default '{}'::jsonb, primary key(location_id,message_id)
);
create index if not exists copilot_messages_thread_idx on public.copilot_crm_messages_cache(location_id,conversation_id,created_at);
create table if not exists public.copilot_crm_calls_cache (
 location_id text not null, message_id text not null, contact_id text not null,
 conversation_id text, duration integer, recording_url text, transcript_status text,
 transcript jsonb, created_at timestamptz, raw_json jsonb not null default '{}'::jsonb,
 primary key(location_id,message_id)
);
create table if not exists public.copilot_crm_tasks_cache (
 location_id text not null, task_id text not null, contact_id text not null, assigned_to text,
 title text, body text, due_at timestamptz, completed boolean not null default false,
 raw_json jsonb not null default '{}'::jsonb, synced_at timestamptz not null default now(), primary key(location_id,task_id)
);
create table if not exists public.copilot_crm_pipelines_cache (
 location_id text not null, pipeline_id text not null, name text not null,
 stages jsonb not null default '[]'::jsonb, synced_at timestamptz not null default now(), primary key(location_id,pipeline_id)
);
create table if not exists public.copilot_ai_lead_state (
 location_id text not null, opportunity_id text not null, contact_id text not null, context_hash text not null,
 attention_type text not null, priority text not null, requires_response boolean not null,
 relationship_summary text, current_situation text, next_best_action text, reason text,
 draft_reply text, critic_score numeric, critic_json jsonb, model_used text,
 generated_at timestamptz not null default now(), primary key(location_id,opportunity_id)
);
create table if not exists public.copilot_ai_lessons (
 id uuid primary key default gen_random_uuid(), profile_id uuid references public.copilot_profiles(id) on delete cascade,
 scope text not null check (scope in ('user','company')), kind text not null check (kind in ('message_style','follow_up','call_brief','global')),
 lesson text not null, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.copilot_ai_usage_log (
 id uuid primary key default gen_random_uuid(), profile_id uuid references public.copilot_profiles(id),
 location_id text, opportunity_id text, operation text not null, model text not null,
 input_tokens integer, output_tokens integer, estimated_cost numeric, latency_ms integer,
 created_at timestamptz not null default now()
);
create table if not exists public.copilot_action_audit_log (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.copilot_profiles(id),
 location_id text not null, entity_type text not null, entity_id text not null,
 action text not null, request_json jsonb not null default '{}'::jsonb,
 result text not null, idempotency_key text not null unique, provider_result_id text,
 created_at timestamptz not null default now()
);
create table if not exists public.copilot_sync_state (
 location_id text not null, resource text not null, cursor text,
 last_success_at timestamptz, last_error text, updated_at timestamptz not null default now(),
 primary key(location_id,resource)
);
-- The browser uses Supabase Auth only. All data access goes through the authenticated API.
do $$ declare t text; begin
 foreach t in array array[
  'copilot_profiles','copilot_locations','copilot_user_ghl_mappings','copilot_user_preferences',
  'copilot_crm_contacts_cache','copilot_crm_opportunities_cache','copilot_crm_conversations_cache',
  'copilot_crm_messages_cache','copilot_crm_calls_cache','copilot_crm_tasks_cache','copilot_crm_pipelines_cache',
  'copilot_ai_lead_state','copilot_ai_lessons','copilot_ai_usage_log','copilot_action_audit_log','copilot_sync_state'
 ] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('revoke all on public.%I from anon, authenticated', t);
 end loop;
end $$;
